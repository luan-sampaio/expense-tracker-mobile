import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  createPendingMutation,
  createTransaction,
  normalizeTransaction,
} from '@/src/domain/transactions';
import { createDemoTransactions } from '@/src/mocks/demoTransactions';
import { getUserFacingError } from '@/src/services/errorMessages';
import {
  applyPendingMutations,
  compactQueue,
  removeAppliedMutations,
} from '@/src/services/syncQueue';
import { transactionsApi } from '@/src/services/transactionsApi';
import { ExpenseState } from '@/src/types';
import { successFeedback } from '@/src/utils/haptics';

let isFlushingQueue = false;

function ensureTransactionList(data: unknown) {
  if (Array.isArray(data)) {
    return data.map(normalizeTransaction);
  }

  throw new Error('Resposta inesperada do servidor ao carregar transações.');
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      transactions: [],
      pendingMutations: [],
      isLoading: false,
      error: null,
      lastSyncAt: null,
      syncStatus: 'synced',
      isUsingMockData: false,

      addTransaction: (transaction) => {
        const newTransaction = createTransaction(transaction);

        if (get().isUsingMockData) {
          set((state) => ({
            transactions: [...state.transactions, newTransaction],
            error: null,
            syncStatus: 'synced',
          }));
          return;
        }

        const pendingMutation = createPendingMutation({
          type: 'create',
          transaction: newTransaction,
        });

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
          syncStatus: 'online',
        }));
        get().syncAll({ silent: true });
      },

      removeTransaction: (id) => {
        if (get().isUsingMockData) {
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
            error: null,
            syncStatus: 'synced',
          }));
          return;
        }

        const pendingMutation = createPendingMutation({
          type: 'delete',
          transactionId: id,
        });

        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
          syncStatus: 'online',
        }));
        get().syncAll({ silent: true });
      },

      updateTransaction: (id, updatedFields) => {
        const existing = get().transactions.find((t) => t.id === id);
        if (!existing) return;
        const updated = normalizeTransaction({ ...existing, ...updatedFields });

        if (get().isUsingMockData) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? updated : t
            ),
            error: null,
            syncStatus: 'synced',
          }));
          return;
        }

        const pendingMutation = createPendingMutation({
          type: 'update',
          transaction: updated,
        });

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? updated : t
          ),
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
          syncStatus: 'online',
        }));
        get().syncAll({ silent: true });
      },

      clearAll: () => {
        if (get().isUsingMockData) {
          set({
            transactions: [],
            pendingMutations: [],
            error: null,
            syncStatus: 'synced',
          });
          return;
        }

        const deleteMutations = get().transactions.map((transaction) =>
          createPendingMutation({
            type: 'delete' as const,
            transactionId: transaction.id,
          })
        );

        set((state) => ({
          transactions: [],
          pendingMutations: deleteMutations.reduce(
            (queue, mutation) => compactQueue(queue, mutation),
            state.pendingMutations
          ),
          error: null,
          syncStatus: deleteMutations.length > 0 ? 'online' : state.syncStatus,
        }));
        get().syncAll({ silent: true });
      },

      loadMockData: () => {
        set({
          transactions: createDemoTransactions().map(normalizeTransaction),
          pendingMutations: [],
          isUsingMockData: true,
          error: null,
          lastSyncAt: null,
          syncStatus: 'synced',
        });
      },

      clearMockData: () => {
        set({
          transactions: [],
          pendingMutations: [],
          isUsingMockData: false,
          error: null,
          lastSyncAt: null,
          syncStatus: 'synced',
        });
      },

      syncAll: async (options) => {
        if (get().isUsingMockData) {
          set({ isLoading: false, error: null, syncStatus: 'synced' });
          return;
        }

        if (isFlushingQueue) return;

        isFlushingQueue = true;
        if (!options?.silent) {
          set({ isLoading: true, error: null, syncStatus: 'syncing' });
        } else {
          set({ syncStatus: 'syncing' });
        }

        try {
          const pendingMutations = get().pendingMutations;
          const hadPendingMutations = pendingMutations.length > 0;
          const syncResponse = await transactionsApi.sync(pendingMutations);

          if (syncResponse) {
            const syncResults = Array.isArray(syncResponse.results)
              ? syncResponse.results
              : [];
            const appliedMutationIds = syncResults
              .filter((result) => result.status === 'applied')
              .map((result) => result.client_operation_id);

            set((state) => ({
              pendingMutations: removeAppliedMutations(
                state.pendingMutations,
                appliedMutationIds
              ),
            }));
          }

          const data = Array.isArray(syncResponse?.transactions)
            ? syncResponse.transactions
            : await transactionsApi.list();
          const normalized = ensureTransactionList(data); // backend retorna Decimal como string
          const localWithPending = applyPendingMutations(
            normalized,
            get().pendingMutations
          );
          const hasPendingMutations = get().pendingMutations.length > 0;

          if (hadPendingMutations && !hasPendingMutations) {
            successFeedback();
          }

          set({
            transactions: localWithPending,
            isLoading: false,
            error: hasPendingMutations
              ? 'Algumas alterações ainda não foram sincronizadas.'
              : null,
            lastSyncAt: new Date().toISOString(),
            syncStatus: hasPendingMutations ? 'online' : 'synced',
          });
        } catch (err) {
          console.error('Sync failed:', err);
          const hasPendingMutations = get().pendingMutations.length > 0;
          const errorMessage = hasPendingMutations
            ? 'Modo offline: suas alterações foram salvas neste aparelho e serão sincronizadas automaticamente.'
            : getUserFacingError(err);

          set({
            isLoading: false,
            error: options?.silent && !hasPendingMutations ? get().error : errorMessage,
            syncStatus: 'offline',
          });
        } finally {
          isFlushingQueue = false;
        }
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        const state = persistedState as Partial<ExpenseState>;

        return {
          ...state,
          transactions: state.transactions?.map(normalizeTransaction) ?? [],
          pendingMutations: state.pendingMutations ?? [],
          isLoading: false,
          error: null,
          lastSyncAt: state.lastSyncAt ?? null,
          syncStatus: state.syncStatus ?? 'synced',
          isUsingMockData: state.isUsingMockData ?? false,
        };
      },
    }
  )
);
