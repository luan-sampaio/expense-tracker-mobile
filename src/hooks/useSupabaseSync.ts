import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useExpenseStore } from '../store/useExpenseStore';

export function useSupabaseSync() {
  const fetchCloudTransactions = useExpenseStore((state) => state.fetchCloudTransactions);

  useEffect(() => {
    // Fetch transactions from cloud when app starts
    fetchCloudTransactions();
  }, [fetchCloudTransactions]);

  // Optional: Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        (payload: any) => {
          console.log('Real-time change received:', payload);
          fetchCloudTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCloudTransactions]);
}
