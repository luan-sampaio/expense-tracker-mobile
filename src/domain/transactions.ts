import { getCategoryMeta } from '@/src/constants/categories';
import { PendingMutation, Transaction, TransactionType } from '@/src/types';

export type TransactionPeriod = 'week' | 'month' | 'year' | 'all';
export type TransactionTypeFilter = 'all' | TransactionType;

export interface TransactionFilters {
  period: TransactionPeriod;
  type: TransactionTypeFilter;
  category: string;
  search: string;
}

export type PendingMutationInput =
  | {
      type: 'create';
      transaction: Transaction;
    }
  | {
      type: 'update';
      transaction: Transaction;
    }
  | {
      type: 'delete';
      transactionId: string;
    };

export function createTransactionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function roundCurrency(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function normalizeTransaction(transaction: Transaction): Transaction {
  return { ...transaction, amount: roundCurrency(Number(transaction.amount)) };
}

export function createTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
  return normalizeTransaction({
    ...transaction,
    id: createTransactionId(),
  });
}

export function createPendingMutation(mutation: PendingMutationInput): PendingMutation {
  return {
    ...mutation,
    id: createTransactionId(),
    createdAt: new Date().toISOString(),
  };
}

export function sortTransactionsByDate(transactions: Transaction[]) {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function calculateBalance(transactions: Transaction[]) {
  const total = transactions.reduce((sum, transaction) => {
    return transaction.type === 'income'
      ? sum + transaction.amount
      : sum - transaction.amount;
  }, 0);

  return roundCurrency(total);
}

export function sumTransactionsByType(
  transactions: Transaction[],
  type: TransactionType
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => roundCurrency(total + transaction.amount), 0);
}

export function groupExpensesByCategory(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = roundCurrency(
        (acc[transaction.category] ?? 0) + transaction.amount
      );
      return acc;
    }, {} as Record<string, number>);
}

export function getTransactionCategoryIds(transactions: Transaction[]) {
  return Array.from(new Set(transactions.map((item) => item.category)))
    .sort((a, b) => getCategoryMeta(a).label.localeCompare(getCategoryMeta(b).label));
}

export function isTransactionWithinPeriod(date: string, period: TransactionPeriod) {
  if (period === 'all') return true;

  const transactionDate = new Date(date);
  const today = new Date();

  if (period === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return transactionDate >= weekAgo;
  }

  if (period === 'month') {
    return (
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getFullYear() === today.getFullYear()
    );
  }

  return transactionDate.getFullYear() === today.getFullYear();
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return sortTransactionsByDate(
    transactions
      .filter((transaction) => isTransactionWithinPeriod(transaction.date, filters.period))
      .filter((transaction) => filters.type === 'all' || transaction.type === filters.type)
      .filter((transaction) => filters.category === 'all' || transaction.category === filters.category)
      .filter((transaction) => {
        if (!normalizedSearch) return true;

        return transaction.description.toLowerCase().includes(normalizedSearch);
      })
  );
}

export function getPendingTransactionId(mutation: PendingMutation) {
  return mutation.type === 'delete'
    ? mutation.transactionId
    : mutation.transaction.id;
}
