import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { ExpenseState, PendingMutation, Transaction } from '../types';

let isFlushingQueue = false;

function createMutationId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function normalizeTransaction(transaction: Transaction): Transaction {
  return { ...transaction, amount: Number(transaction.amount) };
}

function isNotFound(error: unknown) {
  return error instanceof Error && error.message.includes('404');
}

function compactQueue(queue: PendingMutation[], next: PendingMutation) {
  const filtered = queue.filter((mutation) => {
    if (next.type === 'upsert') {
      if (mutation.type === 'upsert') {
        return mutation.transaction.id !== next.transaction.id;
      }

      return mutation.transactionId !== next.transaction.id;
    }

    if (mutation.type === 'upsert') {
      return mutation.transaction.id !== next.transactionId;
    }

    return mutation.transactionId !== next.transactionId;
  });

  return [...filtered, next];
}

function applyPendingMutations(
  transactions: Transaction[],
  pendingMutations: PendingMutation[]
) {
  const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));

  pendingMutations.forEach((mutation) => {
    if (mutation.type === 'upsert') {
      byId.set(mutation.transaction.id, mutation.transaction);
      return;
    }

    byId.delete(mutation.transactionId);
  });

  return Array.from(byId.values());
}

async function pushMutation(mutation: PendingMutation) {
  if (mutation.type === 'upsert') {
    await api.post('/transactions/', mutation.transaction);
    return;
  }

  try {
    await api.delete(`/transactions/${mutation.transactionId}/`);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      transactions: [],
      pendingMutations: [],
      isLoading: false,
      error: null,
      lastSyncAt: null,

      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          amount: Number(transaction.amount),
          id: createMutationId(),
        };
        const pendingMutation: PendingMutation = {
          id: createMutationId(),
          type: 'upsert',
          transaction: newTransaction,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
        }));
        get().syncAll({ silent: true });
      },

      removeTransaction: (id) => {
        const pendingMutation: PendingMutation = {
          id: createMutationId(),
          type: 'delete',
          transactionId: id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
        }));
        get().syncAll({ silent: true });
      },

      updateTransaction: (id, updatedFields) => {
        const existing = get().transactions.find((t) => t.id === id);
        if (!existing) return;
        const updated = normalizeTransaction({ ...existing, ...updatedFields });
        const pendingMutation: PendingMutation = {
          id: createMutationId(),
          type: 'upsert',
          transaction: updated,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? updated : t
          ),
          pendingMutations: compactQueue(state.pendingMutations, pendingMutation),
          error: null,
        }));
        get().syncAll({ silent: true });
      },

      clearAll: () => set({ transactions: [] }),

      syncAll: async (options) => {
        if (isFlushingQueue) return;

        isFlushingQueue = true;
        if (!options?.silent) {
          set({ isLoading: true, error: null });
        }

        try {
          const pendingMutations = [...get().pendingMutations];

          for (const mutation of pendingMutations) {
            await pushMutation(mutation);
            set((state) => ({
              pendingMutations: state.pendingMutations.filter((item) => item.id !== mutation.id),
            }));
          }

          const data = await api.get<Transaction[]>('/transactions/');
          const normalized = data.map(normalizeTransaction); // backend retorna Decimal como string
          const localWithPending = applyPendingMutations(normalized, get().pendingMutations);
          set({
            transactions: localWithPending,
            isLoading: false,
            error: null,
            lastSyncAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Sync failed:', err);
          const hasPendingMutations = get().pendingMutations.length > 0;
          const errorMessage = hasPendingMutations
            ? 'Sem conexão com o servidor. Suas alterações locais foram salvas e serão sincronizadas automaticamente.'
            : 'Não foi possível sincronizar com o servidor.';

          set({
            isLoading: false,
            error: options?.silent && !hasPendingMutations ? get().error : errorMessage,
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
