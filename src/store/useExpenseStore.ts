import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { ExpenseState, Transaction } from '../types';

export const storage = new MMKV({
  id: 'expense-tracker-storage',
});

// Create a custom storage adapter for Zustand
const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};

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
      name: 'expense-storage', // key in MMKV
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
