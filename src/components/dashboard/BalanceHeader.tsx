import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { formatCurrency, formatMonthLabel } from '@/src/utils/formatters';
import { getDashboardMetrics } from '@/src/utils/transactionMetrics';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacer } from '../ui/Spacer';
import { Typography } from '../ui/Typography';

export function BalanceHeader() {
  const transactions = useExpenseStore((state) => state.transactions);
  const metrics = getDashboardMetrics(transactions);
  const monthLabel = formatMonthLabel(new Date());
  const topExpenseLabel = metrics.topExpense
    ? `${metrics.topExpense.description} · ${formatCurrency(metrics.topExpense.amount)}`
    : 'Nenhuma despesa no mês';
  const topCategoryLabel = metrics.topExpenseCategory
    ? `${metrics.topExpenseCategory.category.icon} ${metrics.topExpenseCategory.category.label} · ${formatCurrency(metrics.topExpenseCategory.amount)}`
    : 'Nenhuma categoria ainda';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
          Saldo do mês
        </Typography>
        <Spacer size="xs" />
        <Typography variant="hero" weight="bold" color={theme.colors.primaryText}>
          {formatCurrency(metrics.balance)}
        </Typography>
        <Typography variant="caption" color={theme.colors.secondaryText}>
          {monthLabel}
        </Typography>
        <Spacer size="lg" />
        <View style={styles.row}>
          <View style={styles.miniCard}>
            <View style={[styles.dot, { backgroundColor: theme.colors.income }]} />
            <View>
              <Typography variant="caption" color={theme.colors.secondaryText}>Receitas do mês</Typography>
              <Typography variant="body" weight="semibold" color={theme.colors.income}>
                {formatCurrency(metrics.income)}
              </Typography>
            </View>
          </View>
          <View style={styles.miniCard}>
            <View style={[styles.dot, { backgroundColor: theme.colors.expense }]} />
            <View>
              <Typography variant="caption" color={theme.colors.secondaryText}>Despesas do mês</Typography>
              <Typography variant="body" weight="semibold" color={theme.colors.expense}>
                {formatCurrency(metrics.expenses)}
              </Typography>
            </View>
          </View>
        </View>
        <Spacer size="lg" />
        <View style={styles.insightsGrid}>
          <View style={styles.insight}>
            <Typography variant="caption" color={theme.colors.secondaryText}>
              Maior gasto
            </Typography>
            <Typography variant="body" weight="semibold">
              {topExpenseLabel}
            </Typography>
          </View>
          <View style={styles.insight}>
            <Typography variant="caption" color={theme.colors.secondaryText}>
              Categoria destaque
            </Typography>
            <Typography variant="body" weight="semibold">
              {topCategoryLabel}
            </Typography>
          </View>
          <View style={styles.insight}>
            <Typography variant="caption" color={theme.colors.secondaryText}>
              Comparação mensal
            </Typography>
            <Typography variant="body" weight="semibold" color={theme.colors.info}>
              {metrics.expenseComparison}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.md,
  },
  miniCard: {
    flex: 1,
    minWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  insightsGrid: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  insight: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
});
