import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseState, Transaction } from '../types';

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      transactions: [],
      
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { 
              ...transaction, 
              id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9) 
            },
          ],
        })),
        
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
        
      updateTransaction: (id, updatedFields) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updatedFields } : t
          ),
        })),
        
      clearAll: () => set({ transactions: [] }),
    }),
    {
      name: 'expense-storage', // key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
