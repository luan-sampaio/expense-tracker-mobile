import { Typography } from '@/src/components/ui/Typography';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { formatCurrency, formatMonthLabel } from '@/src/utils/formatters';
import { getDashboardMetrics } from '@/src/utils/transactionMetrics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

function MetricTile({
  label,
  value,
  iconName,
  color,
}: {
  label: string;
  value: string;
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
}) {
  return (
    <View style={styles.metricTile}>
      <View style={styles.metricLead}>
        <View style={styles.metricIcon}>
          <MaterialIcons name={iconName} size={18} color={color} />
        </View>
        <Typography variant="caption" color={theme.colors.secondaryText}>
          {label}
        </Typography>
      </View>
      <Typography variant="body" weight="bold" color={color} numberOfLines={1} style={styles.metricValue}>
        {value}
      </Typography>
    </View>
  );
}

function InsightCard({
  label,
  value,
  iconName,
  iconColor,
  iconBackgroundColor,
}: {
  label: string;
  value: string;
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor: string;
  iconBackgroundColor: string;
}) {
  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.insightText}>
        <Typography variant="caption" color={theme.colors.secondaryText}>
          {label}
        </Typography>
        <Typography variant="body" weight="semibold" numberOfLines={2}>
          {value}
        </Typography>
      </View>
    </View>
  );
}

export function BalanceHeader() {
  const transactions = useExpenseStore((state) => state.transactions);
  const metrics = useMemo(() => getDashboardMetrics(transactions), [transactions]);
  const monthLabel = useMemo(() => formatMonthLabel(new Date()), []);
  const topExpenseLabel = metrics.topExpense
    ? `${metrics.topExpense.description} · ${formatCurrency(metrics.topExpense.amount)}`
    : 'Nenhuma despesa no mês';
  const topCategoryLabel = metrics.topExpenseCategory
    ? `${metrics.topExpenseCategory.category.label} · ${formatCurrency(metrics.topExpenseCategory.amount)}`
    : 'Nenhuma categoria ainda';
  const comparisonColor = metrics.expenseComparison.direction === 'up'
    ? theme.colors.expense
    : metrics.expenseComparison.direction === 'down'
      ? theme.colors.income
      : theme.colors.info;
  const comparisonIcon = metrics.expenseComparison.direction === 'up'
    ? 'north-east'
    : metrics.expenseComparison.direction === 'down'
      ? 'south-east'
      : 'east';
  const balanceColor = metrics.balance >= 0 ? theme.colors.primaryText : theme.colors.expense;
  const monthDescription = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.monthMeta}>
            <MaterialIcons name="calendar-month" size={16} color={theme.colors.primary} />
            <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
              {monthDescription}
            </Typography>
          </View>

          <View style={styles.comparisonMeta}>
            <MaterialIcons name={comparisonIcon} size={16} color={comparisonColor} />
            <Typography variant="caption" weight="semibold" color={comparisonColor} numberOfLines={1}>
              {metrics.expenseComparison.label}
            </Typography>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
            Panorama financeiro
          </Typography>
          <Typography variant="body" weight="semibold" color={theme.colors.secondaryText}>
            Saldo do mês
          </Typography>
          <Typography variant="hero" weight="bold" color={balanceColor} style={styles.balanceAmount}>
            {formatCurrency(metrics.balance)}
          </Typography>
          <Typography variant="body" color={theme.colors.secondaryText}>
            Um retrato rápido do saldo, entradas e saídas do mês atual.
          </Typography>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricTile
          label="Receitas"
          value={formatCurrency(metrics.income)}
          iconName="arrow-upward"
          color={theme.colors.income}
        />
        <MetricTile
          label="Despesas"
          value={formatCurrency(metrics.expenses)}
          iconName="arrow-downward"
          color={theme.colors.expense}
        />
        <MetricTile
          label="Aportes"
          value={formatCurrency(metrics.contributions)}
          iconName="savings"
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.insightsSection}>
        <Typography variant="caption" weight="semibold" color={theme.colors.tertiaryText}>
          Leituras rápidas
        </Typography>
        <View style={styles.insightList}>
          <InsightCard
            label="Maior gasto"
            value={topExpenseLabel}
            iconName="payments"
            iconColor={theme.colors.expense}
            iconBackgroundColor={theme.colors.expenseBackground}
          />
          <InsightCard
            label="Categoria destaque"
            value={topCategoryLabel}
            iconName="category"
            iconColor={theme.colors.primary}
            iconBackgroundColor={theme.colors.primaryBackground}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    gap: theme.spacing.md,
  },
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.lg,
    ...theme.shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  monthMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  comparisonMeta: {
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroContent: {
    gap: theme.spacing.xs,
  },
  balanceAmount: {
    lineHeight: 48,
  },
  metricsGrid: {
    gap: theme.spacing.sm,
  },
  metricLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metricTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  metricIcon: {
    width: 20,
  },
  metricValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  insightsSection: {
    gap: theme.spacing.sm,
  },
  insightList: {
    gap: theme.spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  insightIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  insightText: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
});
