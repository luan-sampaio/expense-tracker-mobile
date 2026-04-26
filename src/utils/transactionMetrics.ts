import { getCategoryMeta } from '@/src/constants/categories';
import {
  calculateBalance,
  groupExpensesByCategory,
  isGoalContribution,
  isSpendingExpense,
  sumTransactionsByType,
} from '@/src/domain/transactions';
import { Transaction } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';

export type ExpenseComparisonDirection = 'up' | 'down' | 'neutral';

export type ExpenseComparison = {
  difference: number;
  direction: ExpenseComparisonDirection;
  label: string;
  percentage: number | null;
};

export type FinancialInsightTone = 'expense' | 'income' | 'primary' | 'info';

export type FinancialSummaryInsight = {
  id: 'top-expense' | 'monthly-change' | 'top-category' | 'daily-average';
  title: string;
  message: string;
  tone: FinancialInsightTone;
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
  summaryInsights: FinancialSummaryInsight[];
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

function getTopExpenseInsight(currentMonth: MonthlyMetrics): FinancialSummaryInsight {
  if (!currentMonth.topExpense) {
    return {
      id: 'top-expense',
      title: 'Maior saída',
      message: 'Ainda não apareceu uma despesa comum que puxe o mês para cima.',
      tone: 'info',
    };
  }

  const fallbackLabel = getCategoryMeta(currentMonth.topExpense.category).label;
  const expenseLabel = currentMonth.topExpense.description.trim() || fallbackLabel;

  return {
    id: 'top-expense',
    title: 'Maior saída',
    message: `${expenseLabel} liderou as saídas do mês com ${formatCurrency(currentMonth.topExpense.amount)}.`,
    tone: 'expense',
  };
}

function getMonthlyChangeInsight(
  currentMonth: MonthlyMetrics,
  expenseComparison: ExpenseComparison
): FinancialSummaryInsight {
  if (currentMonth.expenses === 0 && expenseComparison.difference === 0) {
    return {
      id: 'monthly-change',
      title: 'Ritmo do mês',
      message: 'Sem despesas comuns nos dois meses comparados, então o ritmo segue leve por aqui.',
      tone: 'info',
    };
  }

  if (currentMonth.expenses === 0) {
    return {
      id: 'monthly-change',
      title: 'Ritmo do mês',
      message: `As despesas comuns zeraram neste mês depois de ${formatCurrency(Math.abs(expenseComparison.difference))} no período anterior.`,
      tone: 'income',
    };
  }

  if (expenseComparison.percentage === null) {
    return {
      id: 'monthly-change',
      title: 'Ritmo do mês',
      message: `O mês ganhou movimento com ${formatCurrency(currentMonth.expenses)} em despesas comuns depois de um período anterior sem saídas.`,
      tone: 'info',
    };
  }

  if (expenseComparison.difference === 0) {
    return {
      id: 'monthly-change',
      title: 'Ritmo do mês',
      message: `As despesas comuns repetiram ${formatCurrency(currentMonth.expenses)} e mantiveram o mesmo compasso do mês anterior.`,
      tone: 'info',
    };
  }

  const differenceLabel = formatCurrency(Math.abs(expenseComparison.difference));
  const percentageLabel = `${expenseComparison.percentage.toFixed(0)}%`;

  return {
    id: 'monthly-change',
    title: 'Ritmo do mês',
    message: expenseComparison.difference > 0
      ? `As despesas comuns aceleraram ${percentageLabel}, com ${differenceLabel} a mais que no mês anterior.`
      : `As despesas comuns desaceleraram ${percentageLabel}, com ${differenceLabel} a menos que no mês anterior.`,
    tone: expenseComparison.difference > 0 ? 'expense' : 'income',
  };
}

function getTopCategoryInsight(currentMonth: MonthlyMetrics): FinancialSummaryInsight {
  if (!currentMonth.topExpenseCategory || currentMonth.expenses === 0) {
    return {
      id: 'top-category',
      title: 'Categoria em destaque',
      message: 'Ainda não existe uma categoria puxando a distribuição das despesas comuns.',
      tone: 'info',
    };
  }

  const share = (currentMonth.topExpenseCategory.amount / currentMonth.expenses) * 100;

  return {
    id: 'top-category',
    title: 'Categoria em destaque',
    message: `${currentMonth.topExpenseCategory.category.label} concentrou ${share.toFixed(0)}% das despesas comuns, somando ${formatCurrency(currentMonth.topExpenseCategory.amount)}.`,
    tone: 'primary',
  };
}

function getDailyAverageInsight(currentMonth: MonthlyMetrics): FinancialSummaryInsight {
  if (currentMonth.expenses === 0) {
    return {
      id: 'daily-average',
      title: 'Cadência diária',
      message: 'Ainda não há despesas comuns suficientes para ler a média diária do mês.',
      tone: 'info',
    };
  }

  return {
    id: 'daily-average',
    title: 'Cadência diária',
    message: `A média diária das despesas comuns ficou em ${formatCurrency(currentMonth.dailyAverage)} neste mês.`,
    tone: 'info',
  };
}

export function getSummaryInsights(
  currentMonth: MonthlyMetrics,
  expenseComparison: ExpenseComparison
): FinancialSummaryInsight[] {
  return [
    getTopExpenseInsight(currentMonth),
    getMonthlyChangeInsight(currentMonth, expenseComparison),
    getTopCategoryInsight(currentMonth),
    getDailyAverageInsight(currentMonth),
  ];
}

export function getMonthlyInsights(
  transactions: Transaction[],
  reference = new Date()
): MonthlyInsights {
  const currentMonth = summarizeMonth(transactions, reference);
  const previousMonth = summarizeMonth(transactions, getPreviousMonth(reference));
  const expenseComparison = getExpenseComparison(currentMonth.expenses, previousMonth.expenses);

  return {
    currentMonth,
    expenseComparison,
    previousMonth,
    summaryInsights: getSummaryInsights(currentMonth, expenseComparison),
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
