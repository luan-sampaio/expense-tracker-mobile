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

interface PendingMutationBase {
  id: string;
  createdAt: string;
}

export type PendingMutation =
  | (PendingMutationBase & {
      type: 'create';
      transaction: Transaction;
    })
  | (PendingMutationBase & {
      type: 'update';
      transaction: Transaction;
    })
  | (PendingMutationBase & {
      type: 'delete';
      transactionId: string;
    });

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced';

export interface ExpenseState {
  transactions: Transaction[];
  pendingMutations: PendingMutation[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  syncStatus: SyncStatus;
  isUsingMockData: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  clearAll: () => void;
  loadMockData: () => void;
  clearMockData: () => void;
  syncAll: (options?: { silent?: boolean }) => Promise<void>;
}
