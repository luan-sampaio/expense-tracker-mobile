import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { ExpenseState, Transaction } from '../types';

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,

      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        };
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
        api.post('/transactions/', newTransaction).catch((err) =>
          console.error('Sync add failed:', err)
        );
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        api.delete(`/transactions/${id}/`).catch((err: Error) => {
          if (!err.message.includes('404')) {
            console.error('Sync remove failed:', err);
          }
        });
      },

      updateTransaction: (id, updatedFields) => {
        const existing = get().transactions.find((t) => t.id === id);
        if (!existing) return;
        const updated = { ...existing, ...updatedFields };
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? updated : t
          ),
        }));
        api.post(`/transactions/`, updated).catch((err) =>
          console.error('Sync update failed:', err)
        );
      },

      clearAll: () => set({ transactions: [] }),

      syncAll: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.get<Transaction[]>('/transactions/');
          const normalized = data.map((t) => ({ ...t, amount: Number(t.amount) }));
          set({ transactions: normalized, isLoading: false });
        } catch (err) {
          console.error('Sync failed:', err);
          set({ isLoading: false, error: 'Não foi possível sincronizar com o servidor.' });
        }
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
