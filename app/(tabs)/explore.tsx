import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import {
  groupExpensesByCategory,
  isSpendingExpense,
  sortTransactionsByDate,
} from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { Transaction } from '@/src/types';
import { formatCurrency, formatMonthLabel } from '@/src/utils/formatters';
import { getDashboardMetrics } from '@/src/utils/transactionMetrics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const SUMMARY_VISIBILITY_STORAGE_KEY = 'summary-section-visibility';

type SummarySectionVisibility = {
  categorySpending: boolean;
  topExpenses: boolean;
};

const DEFAULT_SUMMARY_VISIBILITY: SummarySectionVisibility = {
  categorySpending: true,
  topExpenses: true,
};

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(date: string, reference: Date) {
  const transactionDate = new Date(date);

  return (
    transactionDate.getMonth() === reference.getMonth() &&
    transactionDate.getFullYear() === reference.getFullYear()
  );
}

function getDaysForAverage(reference: Date) {
  const today = new Date();
  const selectedMonth = getMonthStart(reference);
  const currentMonth = getMonthStart(today);

  if (selectedMonth.getTime() === currentMonth.getTime()) {
    return today.getDate();
  }

  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
}

function getMonthTransactions(transactions: Transaction[], reference: Date) {
  return transactions.filter((transaction) => isSameMonth(transaction.date, reference));
}

function getTopExpenses(transactions: Transaction[]) {
  return sortTransactionsByDate(transactions)
    .filter(isSpendingExpense)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

function MetricCard({
  label,
  value,
  iconName,
  color,
  backgroundColor,
}: {
  label: string;
  value: string;
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={[styles.metricIcon, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name={iconName} size={20} color={color} />
      </View>
      <View style={styles.metricText}>
        <Typography variant="caption" color={theme.colors.secondaryText}>
          {label}
        </Typography>
        <Typography variant="title" weight="bold" color={color} numberOfLines={1}>
          {value}
        </Typography>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const transactions = useExpenseStore((state) => state.transactions);
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthStart(new Date()));
  const [sectionVisibility, setSectionVisibility] = useState<SummarySectionVisibility>(DEFAULT_SUMMARY_VISIBILITY);
  const { width } = useWindowDimensions();
  const isNarrowScreen = width <= 380;
  const chartWidth = Math.max(width - theme.spacing.lg * 2, 260);
  const chartHeight = isNarrowScreen ? 190 : 220;

  const monthTransactions = useMemo(
    () => getMonthTransactions(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const metrics = useMemo(
    () => getDashboardMetrics(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const expensesByCategory = useMemo(
    () => groupExpensesByCategory(monthTransactions),
    [monthTransactions]
  );

  const chartData = useMemo(() => {
    const totalExpenses = Object.values(expensesByCategory).reduce((total, amount) => {
      return total + amount;
    }, 0);

    return Object.keys(expensesByCategory)
      .map((categoryName) => {
        const categoryMeta = getCategoryMeta(categoryName);
        const amount = expensesByCategory[categoryName];

        return {
          name: categoryMeta.label,
          population: amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: categoryMeta.color,
          legendFontColor: theme.colors.primaryText,
          legendFontSize: 14,
        };
      })
      .sort((a, b) => b.population - a.population);
  }, [expensesByCategory]);

  const topExpenses = useMemo(
    () => getTopExpenses(monthTransactions),
    [monthTransactions]
  );

  const dailyAverage = metrics.expenses / getDaysForAverage(selectedMonth);
  const monthLabel = formatMonthLabel(selectedMonth);
  const hasMonthData = monthTransactions.length > 0;
  const comparisonColor = metrics.expenseComparison.direction === 'up'
    ? theme.colors.expense
    : metrics.expenseComparison.direction === 'down'
      ? theme.colors.income
      : theme.colors.info;
  const comparisonIcon = metrics.expenseComparison.direction === 'up'
    ? 'trending-up'
    : metrics.expenseComparison.direction === 'down'
      ? 'trending-down'
      : 'trending-flat';

  const chartConfig = {
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    color: (opacity = 1) => `rgba(45, 42, 38, ${opacity})`,
  };

  useEffect(() => {
    AsyncStorage.getItem(SUMMARY_VISIBILITY_STORAGE_KEY)
      .then((storedValue) => {
        if (!storedValue) return;

        const parsed = JSON.parse(storedValue) as Partial<SummarySectionVisibility>;
        setSectionVisibility({
          ...DEFAULT_SUMMARY_VISIBILITY,
          ...parsed,
        });
      })
      .catch(() => undefined);
  }, []);

  const updateSectionVisibility = (
    section: keyof SummarySectionVisibility,
    isVisible: boolean
  ) => {
    setSectionVisibility((current) => {
      const nextVisibility = {
        ...current,
        [section]: isVisible,
      };

      AsyncStorage.setItem(
        SUMMARY_VISIBILITY_STORAGE_KEY,
        JSON.stringify(nextVisibility)
      ).catch(() => undefined);

      return nextVisibility;
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Typography variant="heading" weight="bold">
            Resumo mensal
          </Typography>
          <Typography variant="body" color={theme.colors.secondaryText}>
            Receitas, gastos, aportes e saldo por período
          </Typography>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setSelectedMonth((current) => addMonths(current, -1))}
            accessibilityRole="button"
            accessibilityLabel="Ver mês anterior"
          >
            <MaterialIcons name="chevron-left" size={26} color={theme.colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.monthText}>
            <Typography variant="title" weight="bold" align="center">
              {monthLabel}
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setSelectedMonth((current) => addMonths(current, 1))}
            accessibilityRole="button"
            accessibilityLabel="Ver próximo mês"
          >
            <MaterialIcons name="chevron-right" size={26} color={theme.colors.primaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
            Saldo do período
          </Typography>
          <Typography
            variant="hero"
            weight="bold"
            color={metrics.balance >= 0 ? theme.colors.primaryText : theme.colors.expense}
            align="center"
            numberOfLines={1}
            style={styles.balanceAmount}
          >
            {formatCurrency(metrics.balance)}
          </Typography>
          <View style={styles.comparisonPill}>
            <MaterialIcons name={comparisonIcon} size={18} color={comparisonColor} />
            <Typography variant="caption" weight="semibold" color={comparisonColor}>
              {metrics.expenseComparison.label}
            </Typography>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Receitas"
            value={formatCurrency(metrics.income)}
            iconName="arrow-upward"
            color={theme.colors.income}
            backgroundColor={theme.colors.incomeBackground}
          />
          <MetricCard
            label="Despesas comuns"
            value={formatCurrency(metrics.expenses)}
            iconName="arrow-downward"
            color={theme.colors.expense}
            backgroundColor={theme.colors.expenseBackground}
          />
          <MetricCard
            label="Aportes"
            value={formatCurrency(metrics.contributions)}
            iconName="savings"
            color={theme.colors.primary}
            backgroundColor={theme.colors.primaryBackground}
          />
          <MetricCard
            label="Média diária"
            value={formatCurrency(dailyAverage)}
            iconName="calendar-today"
            color={theme.colors.info}
            backgroundColor={theme.colors.infoBackground}
          />
        </View>

        <View style={styles.sectionToggles}>
          <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
            Seções
          </Typography>
          <View style={styles.sectionToggleList}>
            <Chip
              label="Categorias"
              size="sm"
              selected={sectionVisibility.categorySpending}
              onPress={() => updateSectionVisibility('categorySpending', !sectionVisibility.categorySpending)}
              accessibilityLabel={
                sectionVisibility.categorySpending
                  ? 'Ocultar gastos por categoria'
                  : 'Mostrar gastos por categoria'
              }
            />
            <Chip
              label="Top despesas"
              size="sm"
              selected={sectionVisibility.topExpenses}
              onPress={() => updateSectionVisibility('topExpenses', !sectionVisibility.topExpenses)}
              accessibilityLabel={
                sectionVisibility.topExpenses
                  ? 'Ocultar top despesas'
                  : 'Mostrar top despesas'
              }
            />
          </View>
        </View>

        {!hasMonthData ? (
          <EmptyState
            iconName="bar-chart"
            title="Sem dados neste mês"
            message="Quando houver receitas, despesas ou aportes no período, o resumo aparece aqui."
            style={styles.emptyState}
          />
        ) : (
          <>
            {sectionVisibility.categorySpending && (
              <>
                <SectionHeader
                  title="Gastos por categoria"
                  subtitle="Somente despesas comuns entram nesta distribuição"
                  style={styles.sectionHeader}
                />

                {chartData.length === 0 ? (
                  <View style={styles.surfaceCard}>
                    <Typography variant="body" color={theme.colors.secondaryText} align="center">
                      Nenhuma despesa comum registrada neste mês.
                    </Typography>
                  </View>
                ) : (
                  <View style={styles.chartWrapper}>
                    <PieChart
                      data={chartData}
                      width={chartWidth}
                      height={chartHeight}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft={isNarrowScreen ? '4' : '15'}
                      hasLegend={false}
                      absolute
                    />
                    <View style={styles.legendList}>
                      {chartData.map((item) => (
                        <View key={item.name} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                          <Typography
                            variant="caption"
                            color={theme.colors.secondaryText}
                            numberOfLines={1}
                            style={styles.legendName}
                          >
                            {item.name}
                          </Typography>
                          <View style={styles.legendValue}>
                            <Typography variant="caption" weight="bold" color={theme.colors.primaryText}>
                              {formatPercentage(item.percentage)}
                            </Typography>
                            <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
                              {formatCurrency(item.population)}
                            </Typography>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            {sectionVisibility.topExpenses && (
              <>
                <SectionHeader
                  title="Top despesas"
                  subtitle="As maiores despesas comuns do mês"
                  style={styles.sectionHeader}
                />

                <View style={styles.surfaceCard}>
                  {topExpenses.length === 0 ? (
                    <Typography variant="body" color={theme.colors.secondaryText} align="center">
                      Nenhuma despesa comum para listar.
                    </Typography>
                  ) : (
                    topExpenses.map((transaction, index) => {
                      const category = getCategoryMeta(transaction.category);

                      return (
                        <View
                          key={transaction.id}
                          style={[
                            styles.expenseRow,
                            index < topExpenses.length - 1 && styles.expenseRowBorder,
                          ]}
                        >
                          <View style={[styles.rankBadge, { backgroundColor: category.backgroundColor }]}>
                            <Typography variant="caption" weight="bold" color={category.color}>
                              {index + 1}
                            </Typography>
                          </View>
                          <View style={styles.expenseInfo}>
                            <Typography variant="body" weight="semibold" numberOfLines={1}>
                              {transaction.description || category.label}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.secondaryText}>
                              {category.label}
                            </Typography>
                          </View>
                          <Typography variant="body" weight="bold" color={theme.colors.expense}>
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            )}
          </>
        )}

        <Spacer size="xl" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.xs,
  },
  monthSelector: {
    minHeight: 56,
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  monthButton: {
    width: theme.touchTarget.min,
    height: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthText: {
    flex: 1,
    minWidth: 0,
  },
  balanceCard: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  balanceAmount: {
    width: '100%',
  },
  comparisonPill: {
    minHeight: theme.touchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  metricsGrid: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sectionToggles: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  sectionToggleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 150,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  metricIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  metricText: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  emptyState: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    marginTop: theme.spacing.xl,
  },
  surfaceCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: theme.spacing.md,
  },
  legendList: {
    alignSelf: 'stretch',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    minWidth: 0,
  },
  legendValue: {
    minWidth: 92,
    alignItems: 'flex-end',
    gap: 2,
  },
  expenseRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  expenseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  rankBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  expenseInfo: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
});
