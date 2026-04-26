import { getCategoryMeta } from '@/src/constants/categories';
import {
  calculateBalance,
  groupExpensesByCategory,
  isGoalContribution,
  isSpendingExpense,
  sumTransactionsByType,
} from '@/src/domain/transactions';
import { Transaction } from '@/src/types';

export type ExpenseComparisonDirection = 'up' | 'down' | 'neutral';

export type ExpenseComparison = {
  difference: number;
  direction: ExpenseComparisonDirection;
  label: string;
  percentage: number | null;
};

type TopExpenseCategory = {
  amount: number;
  category: ReturnType<typeof getCategoryMeta>;
};

export type MonthlyMetrics = {
  balance: number;
  contributions: number;
  dailyAverage: number;
  expenseCategoryTotals: Record<string, number>;
  expenses: number;
  income: number;
  monthStart: Date;
  referenceDate: Date;
  topExpense: Transaction | null;
  topExpenseCategory: TopExpenseCategory | null;
  topExpenses: Transaction[];
  transactions: Transaction[];
};

export type MonthlyInsights = {
  currentMonth: MonthlyMetrics;
  expenseComparison: ExpenseComparison;
  previousMonth: MonthlyMetrics;
};

export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameMonth(date: string, reference: Date) {
  const transactionDate = new Date(date);

  return (
    transactionDate.getMonth() === reference.getMonth() &&
    transactionDate.getFullYear() === reference.getFullYear()
  );
}

export function getPreviousMonth(reference: Date) {
  return addMonths(reference, -1);
}

export function getMonthTransactions(transactions: Transaction[], reference: Date) {
  return transactions.filter((transaction) => isSameMonth(transaction.date, reference));
}

export function getDaysForAverage(reference: Date, today = new Date()) {
  const selectedMonth = getMonthStart(reference);
  const currentMonth = getMonthStart(today);

  if (selectedMonth.getTime() === currentMonth.getTime()) {
    return today.getDate();
  }

  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
}

function sortExpensesByAmount(transactions: Transaction[]) {
  return transactions
    .filter(isSpendingExpense)
    .sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function getTopExpenses(transactions: Transaction[], limit = 5) {
  return sortExpensesByAmount(transactions).slice(0, limit);
}

function getTopExpenseCategory(expenseCategoryTotals: Record<string, number>) {
  const [categoryId, amount] = Object.entries(expenseCategoryTotals)
    .sort(([, a], [, b]) => b - a)[0] ?? [];

  if (!categoryId) return null;

  return {
    amount,
    category: getCategoryMeta(categoryId),
  };
}

export function summarizeMonth(transactions: Transaction[], reference: Date): MonthlyMetrics {
  const monthTransactions = getMonthTransactions(transactions, reference);
  const expenseCategoryTotals = groupExpensesByCategory(monthTransactions);
  const topExpenses = getTopExpenses(monthTransactions);
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
    contributions,
    dailyAverage: expenses / getDaysForAverage(reference),
    expenseCategoryTotals,
    expenses,
    income,
    monthStart: getMonthStart(reference),
    referenceDate: reference,
    topExpense: topExpenses[0] ?? null,
    topExpenseCategory: getTopExpenseCategory(expenseCategoryTotals),
    topExpenses,
    transactions: monthTransactions,
  };
}

export function getExpenseComparison(
  currentExpenses: number,
  previousExpenses: number
): ExpenseComparison {
  if (currentExpenses === 0) {
    return {
      difference: currentExpenses - previousExpenses,
      percentage: previousExpenses > 0 ? 100 : null,
      label: previousExpenses > 0
        ? 'Sem despesas neste mês'
        : 'Sem despesas nos dois meses',
      direction: 'neutral' as const,
    };
  }

  if (previousExpenses === 0) {
    return {
      difference: currentExpenses,
      percentage: null,
      label: 'Sem despesas no mês anterior',
      direction: 'neutral' as const,
    };
  }

  const difference = currentExpenses - previousExpenses;
  const percentage = Math.abs((difference / previousExpenses) * 100);

  if (difference === 0) {
    return {
      difference,
      percentage: 0,
      label: 'Mesmo gasto do mês anterior',
      direction: 'neutral' as const,
    };
  }

  return {
    difference,
    percentage,
    label: `${percentage.toFixed(0)}% ${difference > 0 ? 'acima' : 'abaixo'} do mês anterior`,
    direction: difference > 0 ? 'up' as const : 'down' as const,
  };
}

export function getMonthlyInsights(
  transactions: Transaction[],
  reference = new Date()
): MonthlyInsights {
  const currentMonth = summarizeMonth(transactions, reference);
  const previousMonth = summarizeMonth(transactions, getPreviousMonth(reference));

  return {
    currentMonth,
    expenseComparison: getExpenseComparison(currentMonth.expenses, previousMonth.expenses),
    previousMonth,
  };
}

export function getDashboardMetrics(transactions: Transaction[], reference = new Date()) {
  const insights = getMonthlyInsights(transactions, reference);

  return {
    ...insights.currentMonth,
    expenseComparison: insights.expenseComparison,
    previousMonth: insights.previousMonth,
  };
}
