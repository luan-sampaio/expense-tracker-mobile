export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'food' 
  | 'transport' 
  | 'housing' 
  | 'entertainment' 
  | 'salary' 
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO 8601 string
  category: string;
  type: TransactionType;
  description: string;
}

export type PendingMutation =
  | {
      id: string;
      type: 'upsert';
      transaction: Transaction;
      createdAt: string;
    }
  | {
      id: string;
      type: 'delete';
      transactionId: string;
      createdAt: string;
    };

export interface ExpenseState {
  transactions: Transaction[];
  pendingMutations: PendingMutation[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  clearAll: () => void;
  syncAll: (options?: { silent?: boolean }) => Promise<void>;
}
