import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  createPendingMutation,
  createTransactionId,
  createTransaction,
  normalizeTransaction,
} from '@/src/domain/transactions';
import { getUserFacingError } from '@/src/services/errorMessages';
import {
  applyPendingMutations,
  compactQueue,
  removeAppliedMutations,
} from '@/src/services/syncQueue';
import { transactionsApi } from '@/src/services/transactionsApi';
import { BudgetSettings, ExpenseState, FinancialGoalsSettings } from '@/src/types';
import { successFeedback } from '@/src/utils/haptics';

let isFlushingQueue = false;

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  isVisible: true,
  presetId: 'classic',
  allocations: [
    {
      groupId: 'needs',
      label: 'Essenciais',
      percentage: 50,
    },
    {
      groupId: 'wants',
      label: 'Livres',
      percentage: 30,
    },
    {
      groupId: 'savings',
      label: 'Prioridade financeira',
      percentage: 20,
    },
  ],
};

export const DEFAULT_FINANCIAL_GOALS_SETTINGS: FinancialGoalsSettings = {
  isVisible: true,
};

function normalizeBudgetSettings(settings?: BudgetSettings): BudgetSettings {
  const source = settings ?? DEFAULT_BUDGET_SETTINGS;

  return {
    ...DEFAULT_BUDGET_SETTINGS,
    ...source,
    allocations: (source.allocations.length > 0 ? source.allocations : DEFAULT_BUDGET_SETTINGS.allocations).map((allocation) => ({
      ...allocation,
      label: allocation.groupId === 'savings' && allocation.label === 'Reserva'
        ? 'Prioridade financeira'
        : allocation.label,
    })),
  };
}

function normalizeFinancialGoalsSettings(settings?: FinancialGoalsSettings): FinancialGoalsSettings {
  return {
    ...DEFAULT_FINANCIAL_GOALS_SETTINGS,
    ...settings,
  };
}

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
      financialGoals: [],
      financialGoalsSettings: DEFAULT_FINANCIAL_GOALS_SETTINGS,
      pendingMutations: [],
      isLoading: false,
      error: null,
      lastSyncAt: null,
      syncStatus: 'synced',
      budgetSettings: DEFAULT_BUDGET_SETTINGS,

      setBudgetSettings: (settings) => {
        set({ budgetSettings: settings });
      },

      setBudgetVisibility: (isVisible) => {
        set((state) => ({
          budgetSettings: {
            ...state.budgetSettings,
            isVisible,
          },
        }));
      },

      setFinancialGoalsVisibility: (isVisible) => {
        set((state) => ({
          financialGoalsSettings: {
            ...state.financialGoalsSettings,
            isVisible,
          },
        }));
      },

      addFinancialGoal: (goal) => {
        set((state) => ({
          financialGoals: [
            ...state.financialGoals,
            {
              ...goal,
              id: createTransactionId(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateFinancialGoal: (id, goal) => {
        set((state) => ({
          financialGoals: state.financialGoals.map((item) => {
            return item.id === id ? { ...item, ...goal } : item;
          }),
        }));
      },

      removeFinancialGoal: (id) => {
        set((state) => ({
          financialGoals: state.financialGoals.filter((goal) => goal.id !== id),
          transactions: state.transactions.map((transaction) => {
            return transaction.goalId === id
              ? { ...transaction, goalId: undefined }
              : transaction;
          }),
        }));
      },

      addTransaction: (transaction) => {
        const newTransaction = createTransaction(transaction);

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
        const hasPendingBeforeSync = get().pendingMutations.length > 0;

        if (!options?.silent) {
          set({ isLoading: true, error: null, syncStatus: 'syncing' });
        } else if (hasPendingBeforeSync) {
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
      version: 2,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        const state = persistedState as Partial<ExpenseState>;

        return {
          ...state,
          transactions: state.transactions?.map(normalizeTransaction) ?? [],
          financialGoals: state.financialGoals ?? [],
          financialGoalsSettings: normalizeFinancialGoalsSettings(state.financialGoalsSettings),
          pendingMutations: state.pendingMutations ?? [],
          isLoading: false,
          error: null,
          lastSyncAt: state.lastSyncAt ?? null,
          syncStatus: state.syncStatus ?? 'synced',
          budgetSettings: normalizeBudgetSettings(state.budgetSettings),
        };
      },
    }
  )
);
