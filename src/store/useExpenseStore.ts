import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { ExpenseState, Transaction } from '../types';

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,
      
      addTransaction: (transaction) => {
        const newTransaction = { 
          ...transaction, 
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9) 
        };
        
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
        
        // Sync to cloud
        const { syncTransactionToCloud } = get();
        syncTransactionToCloud(newTransaction);
      },
        
      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        
        // Remove from cloud
        const { removeTransactionFromCloud } = get();
        removeTransactionFromCloud(id);
      },
        
      updateTransaction: (id, updatedFields) => {
        const updatedTransaction = get().transactions.find(t => t.id === id);
        if (!updatedTransaction) return;
        
        const newTransaction = { ...updatedTransaction, ...updatedFields };
        
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? newTransaction : t
          ),
        }));
        
        // Sync to cloud
        const { syncTransactionToCloud } = get();
        syncTransactionToCloud(newTransaction);
      },
        
      clearAll: () => set({ transactions: [] }),
      
      // Supabase sync functions
      fetchCloudTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
          
          if (error) throw error;
          
          set({ transactions: data || [], isLoading: false });
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set({ isLoading: false, error: 'Erro ao carregar transações' });
        }
      },
      
      syncTransactionToCloud: async (transaction: Transaction) => {
        try {
          const { error } = await supabase
            .from('transactions')
            .upsert(transaction);
          
          if (error) throw error;
        } catch (error) {
          console.error('Error syncing transaction:', error);
        }
      },
      
      removeTransactionFromCloud: async (id: string) => {
        try {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
        } catch (error) {
          console.error('Error removing transaction from cloud:', error);
        }
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
