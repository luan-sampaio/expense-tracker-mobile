import { getCategoryMeta } from '@/src/constants/categories';
import {
  calculateBalance,
  groupExpensesByCategory,
  isGoalContribution,
  isSpendingExpense,
  sumTransactionsByType,
} from '@/src/domain/transactions';
import { Transaction } from '@/src/types';

function isSameMonth(date: string, reference: Date) {
  const transactionDate = new Date(date);

  return (
    transactionDate.getMonth() === reference.getMonth() &&
    transactionDate.getFullYear() === reference.getFullYear()
  );
}

function getPreviousMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
}

function summarizeMonth(transactions: Transaction[], reference: Date) {
  const monthTransactions = transactions.filter((transaction) =>
    isSameMonth(transaction.date, reference)
  );

  const income = sumTransactionsByType(monthTransactions, 'income');
  const expenses = monthTransactions
    .filter(isSpendingExpense)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const contributions = monthTransactions
    .filter(isGoalContribution)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const balance = calculateBalance(monthTransactions);

  return {
    balance,
    income,
    expenses,
    contributions,
    transactions: monthTransactions,
  };
}

function getTopExpense(transactions: Transaction[]) {
  return transactions
    .filter(isSpendingExpense)
    .sort((a, b) => b.amount - a.amount)[0] ?? null;
}

function getTopExpenseCategory(transactions: Transaction[]) {
  const totals = groupExpensesByCategory(transactions);

  const [categoryId, amount] = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)[0] ?? [];

  if (!categoryId) return null;

  return {
    amount,
    category: getCategoryMeta(categoryId),
  };
}

function getExpenseComparison(currentExpenses: number, previousExpenses: number) {
  if (currentExpenses === 0) {
    return {
      label: previousExpenses > 0
        ? 'Sem despesas neste mês'
        : 'Sem despesas nos dois meses',
      direction: 'neutral' as const,
    };
  }

  if (previousExpenses === 0) {
    return {
      label: 'Sem despesas no mês anterior',
      direction: 'neutral' as const,
    };
  }

  const difference = currentExpenses - previousExpenses;
  const percentage = Math.abs((difference / previousExpenses) * 100);

  if (difference === 0) {
    return {
      label: 'Mesmo gasto do mês anterior',
      direction: 'neutral' as const,
    };
  }

  return {
    label: `${percentage.toFixed(0)}% ${difference > 0 ? 'acima' : 'abaixo'} do mês anterior`,
    direction: difference > 0 ? 'up' as const : 'down' as const,
  };
}

export function getDashboardMetrics(transactions: Transaction[], reference = new Date()) {
  const currentMonth = summarizeMonth(transactions, reference);
  const previousMonth = summarizeMonth(transactions, getPreviousMonth(reference));

  return {
    ...currentMonth,
    topExpense: getTopExpense(currentMonth.transactions),
    topExpenseCategory: getTopExpenseCategory(currentMonth.transactions),
    expenseComparison: getExpenseComparison(currentMonth.expenses, previousMonth.expenses),
    previousMonth,
  };
}
