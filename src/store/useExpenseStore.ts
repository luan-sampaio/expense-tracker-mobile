import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  applyPendingMutations,
  compactQueue,
  createClientId,
  createPendingMutation,
  normalizeTransaction,
  removeAppliedMutations,
} from '../services/syncQueue';
import { transactionsApi } from '../services/transactionsApi';
import { ExpenseState, Transaction } from '../types';
import { successFeedback } from '../utils/haptics';

let isFlushingQueue = false;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido ao sincronizar.';
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

      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          amount: Number(transaction.amount),
          id: createClientId(),
        };
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

      syncAll: async (options) => {
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
            const appliedMutationIds = syncResponse.results
              .filter((result) => result.status === 'applied')
              .map((result) => result.client_operation_id);

            set((state) => ({
              pendingMutations: removeAppliedMutations(
                state.pendingMutations,
                appliedMutationIds
              ),
            }));
          }

          const data = syncResponse?.transactions ?? await transactionsApi.list();
          const normalized = data.map(normalizeTransaction); // backend retorna Decimal como string
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
            : getErrorMessage(err);

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
    }
  )
);
