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
  category: Category | string;
  type: TransactionType;
  description: string;
}

export interface ExpenseState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  fetchCloudTransactions: () => Promise<void>;
  clearAll: () => void;
}
