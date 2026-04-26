import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { formatCurrency, formatMonthLabel } from '@/src/utils/formatters';
import {
  addMonths,
  FinancialInsightTone,
  FinancialSummaryInsight,
  getMonthStart,
  getMonthlyInsights,
} from '@/src/utils/transactionMetrics';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUMMARY_VISIBILITY_STORAGE_KEY = 'summary-section-visibility';

type SummarySectionVisibility = {
  categorySpending: boolean;
  topExpenses: boolean;
};

const DEFAULT_SUMMARY_VISIBILITY: SummarySectionVisibility = {
  categorySpending: true,
  topExpenses: true,
};

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

function getInsightIconName(insightId: FinancialSummaryInsight['id']) {
  if (insightId === 'top-expense') return 'payments';
  if (insightId === 'monthly-change') return 'compare-arrows';
  if (insightId === 'top-category') return 'pie-chart';

  return 'calendar-today';
}

function getToneColors(tone: FinancialInsightTone) {
  if (tone === 'expense') {
    return {
      accent: theme.colors.expense,
      background: theme.colors.expenseBackground,
      border: theme.colors.expenseBorder,
    };
  }

  if (tone === 'income') {
    return {
      accent: theme.colors.income,
      background: theme.colors.incomeBackground,
      border: theme.colors.incomeBorder,
    };
  }

  if (tone === 'primary') {
    return {
      accent: theme.colors.primary,
      background: theme.colors.primaryBackground,
      border: theme.colors.border,
    };
  }

  return {
    accent: theme.colors.info,
    background: theme.colors.infoBackground,
    border: theme.colors.border,
  };
}

function InsightStoryCard({ insight }: { insight: FinancialSummaryInsight }) {
  const toneColors = getToneColors(insight.tone);

  return (
    <View
      style={[
        styles.insightStoryCard,
        {
          backgroundColor: toneColors.background,
          borderColor: toneColors.border,
        },
      ]}
    >
      <View style={styles.insightStoryHeader}>
        <View style={[styles.insightStoryIcon, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons
            name={getInsightIconName(insight.id)}
            size={18}
            color={toneColors.accent}
          />
        </View>
        <Typography variant="caption" weight="semibold" color={toneColors.accent}>
          Insight do periodo
        </Typography>
      </View>

      <View style={styles.insightStoryBody}>
        <Typography variant="body" weight="bold" color={theme.colors.primaryText}>
          {insight.title}
        </Typography>
        <Typography variant="body" color={theme.colors.secondaryText}>
          {insight.message}
        </Typography>
      </View>
    </View>
  );
}

function SectionEmptyMessage({
  iconName,
  title,
  message,
}: {
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  message: string;
}) {
  return (
    <View style={styles.sectionEmptyCard}>
      <View style={styles.sectionEmptyIcon}>
        <MaterialIcons name={iconName} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.sectionEmptyText}>
        <Typography variant="body" weight="semibold" align="center">
          {title}
        </Typography>
        <Typography variant="body" color={theme.colors.secondaryText} align="center">
          {message}
        </Typography>
      </View>
    </View>
  );
}

function MetricCard({
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
    <View style={styles.metricCard}>
      <View style={styles.metricLead}>
        <View style={styles.metricIcon}>
          <MaterialIcons name={iconName} size={20} color={color} />
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

function SummaryGlance({
  label,
  value,
  toneColor,
  backgroundColor,
}: {
  label: string;
  value: string;
  toneColor: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.glanceCard, { backgroundColor }]}>
      <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
        {label}
      </Typography>
      <Typography variant="body" weight="bold" color={toneColor} numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useExpenseStore((state) => state.transactions);
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthStart(new Date()));
  const [sectionVisibility, setSectionVisibility] = useState<SummarySectionVisibility>(DEFAULT_SUMMARY_VISIBILITY);
  const { width } = useWindowDimensions();
  const isNarrowScreen = width <= 380;
  const chartWidth = Math.max(width - theme.spacing.lg * 2, 260);
  const chartHeight = isNarrowScreen ? 190 : 220;

  const insights = useMemo(
    () => getMonthlyInsights(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const metrics = insights.currentMonth;
  const expensesByCategory = metrics.expenseCategoryTotals;

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

  const topExpenses = metrics.topExpenses;
  const summaryInsights = insights.summaryInsights;
  const monthLabel = formatMonthLabel(selectedMonth);
  const hasMonthData = metrics.transactions.length > 0;
  const hasChartData = chartData.length > 0;
  const comparisonColor = insights.expenseComparison.direction === 'up'
    ? theme.colors.expense
    : insights.expenseComparison.direction === 'down'
      ? theme.colors.income
      : theme.colors.info;
  const comparisonIcon = insights.expenseComparison.direction === 'up'
    ? 'trending-up'
    : insights.expenseComparison.direction === 'down'
      ? 'trending-down'
      : 'trending-flat';
  const balanceToneLabel = metrics.balance >= 0 ? 'Saldo respirando' : 'Saldo apertado';
  const balanceToneColor = metrics.balance >= 0 ? theme.colors.primary : theme.colors.expense;
  const topCategoryShare = metrics.topExpenseCategory && metrics.expenses > 0
    ? (metrics.topExpenseCategory.amount / metrics.expenses) * 100
    : 0;
  const comparisonPillBackgroundColor = insights.expenseComparison.direction === 'up'
    ? theme.colors.expenseBackground
    : insights.expenseComparison.direction === 'down'
      ? theme.colors.incomeBackground
      : theme.colors.infoBackground;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: theme.spacing.xxl + insets.bottom + theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerEyebrow}>
            <MaterialIcons name="insights" size={16} color={theme.colors.primary} />
            <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
              Leitura do período
            </Typography>
          </View>
          <View style={styles.header}>
            <Typography variant="heading" weight="bold">
              Resumo mensal
            </Typography>
            <Typography variant="body" color={theme.colors.secondaryText}>
              Um raio-x mais claro do mes para entender onde o dinheiro ganhou ritmo e onde pediu atencao.
            </Typography>
          </View>
          <View style={styles.glanceRow}>
            <SummaryGlance
              label="Clima do mês"
              value={balanceToneLabel}
              toneColor={balanceToneColor}
              backgroundColor={theme.colors.surface}
            />
            <SummaryGlance
              label="Média diária"
              value={formatCurrency(metrics.dailyAverage)}
              toneColor={theme.colors.info}
              backgroundColor={theme.colors.surface}
            />
          </View>
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
            Panorama consolidado
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
          <Typography variant="body" color={theme.colors.secondaryText} align="center">
            Receitas, despesas comuns e aportes reunidos em uma leitura unica do periodo.
          </Typography>
          <View style={[styles.comparisonPill, { backgroundColor: comparisonPillBackgroundColor }]}>
            <MaterialIcons name={comparisonIcon} size={18} color={comparisonColor} />
            <Typography variant="caption" weight="semibold" color={comparisonColor}>
              {insights.expenseComparison.label}
            </Typography>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Receitas"
            value={formatCurrency(metrics.income)}
            iconName="arrow-upward"
            color={theme.colors.income}
          />
          <MetricCard
            label="Despesas comuns"
            value={formatCurrency(metrics.expenses)}
            iconName="arrow-downward"
            color={theme.colors.expense}
          />
          <MetricCard
            label="Aportes"
            value={formatCurrency(metrics.contributions)}
            iconName="savings"
            color={theme.colors.primary}
          />
          <MetricCard
            label="Média diária"
            value={formatCurrency(metrics.dailyAverage)}
            iconName="calendar-today"
            color={theme.colors.info}
          />
        </View>

        {hasMonthData && (
          <View style={styles.insightsCluster}>
            <SectionHeader
              title="Leituras que valem atencao"
              subtitle="Textos curtos para te ajudar a entender o que marcou o periodo"
              style={styles.sectionHeader}
            />
            <View style={styles.insightStoryGrid}>
              {summaryInsights.map((insight) => (
                <InsightStoryCard key={insight.id} insight={insight} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionToggles}>
          <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
            Blocos visiveis
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
            title="Nada para ler neste mes ainda"
            message="Assim que entrar alguma receita, despesa ou aporte, esta area vira um resumo vivo do periodo."
            style={styles.emptyState}
          />
        ) : (
          <>
            {sectionVisibility.categorySpending && (
              <>
                <SectionHeader
                  title="Mapa das despesas"
                  subtitle="So as despesas comuns entram nesta distribuicao visual"
                  style={styles.sectionHeader}
                />

                {!hasChartData ? (
                  <SectionEmptyMessage
                    iconName="donut-large"
                    title="Distribuicao em espera"
                    message="Quando aparecerem despesas comuns, este mapa mostra com clareza quais categorias mais pesaram no mes."
                  />
                ) : (
                  <View style={styles.chartSection}>
                    <View style={styles.chartHighlightCard}>
                      <View style={styles.chartHighlightHeader}>
                        <View style={styles.chartHighlightEyebrow}>
                          <MaterialIcons name="auto-graph" size={16} color={theme.colors.primary} />
                          <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
                            Categoria em destaque
                          </Typography>
                        </View>
                        <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
                          {formatPercentage(topCategoryShare)}
                        </Typography>
                      </View>
                      <Typography variant="body" weight="bold">
                        {metrics.topExpenseCategory?.category.label ?? 'Sem categoria liderando'}
                      </Typography>
                      <Typography variant="body" color={theme.colors.secondaryText}>
                        {metrics.topExpenseCategory
                          ? `${formatCurrency(metrics.topExpenseCategory.amount)} concentrados na principal frente de gasto do mes.`
                          : 'Sem despesas comuns suficientes para destacar uma categoria principal.'}
                      </Typography>
                    </View>

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
                          <View style={styles.legendText}>
                            <Typography
                              variant="caption"
                              color={theme.colors.primaryText}
                              weight="semibold"
                              numberOfLines={1}
                              style={styles.legendName}
                            >
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.secondaryText} numberOfLines={1}>
                              Participacao no total de despesas comuns
                            </Typography>
                          </View>
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
                  </View>
                )}
              </>
            )}

            {sectionVisibility.topExpenses && (
              <>
                <SectionHeader
                  title="Saidas que puxaram o mes"
                  subtitle="As maiores despesas comuns, em ordem de impacto"
                  style={styles.sectionHeader}
                />

                <View style={styles.surfaceCard}>
                  {topExpenses.length === 0 ? (
                    <SectionEmptyMessage
                      iconName="leaderboard"
                      title="Ranking ainda vazio"
                      message="Quando as primeiras despesas comuns aparecerem, este bloco destaca as saidas que mais moveram o periodo."
                    />
                  ) : (
                    topExpenses.map((transaction, index) => {
                      const category = getCategoryMeta(transaction.category);
                      const expenseShare = metrics.expenses > 0
                        ? (transaction.amount / metrics.expenses) * 100
                        : 0;

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
                            <View style={styles.expenseMetaRow}>
                              <Typography variant="caption" color={theme.colors.secondaryText}>
                                {category.label}
                              </Typography>
                              <Typography variant="caption" color={theme.colors.tertiaryText}>
                                {formatPercentage(expenseShare)} do total
                              </Typography>
                            </View>
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
    paddingHorizontal: theme.spacing.lg,
  },
  headerCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  headerEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  header: {
    gap: theme.spacing.xs,
  },
  glanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  glanceCard: {
    flexGrow: 1,
    minWidth: 140,
    gap: 2,
    paddingVertical: theme.spacing.xs,
  },
  monthSelector: {
    minHeight: 56,
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadows.md,
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
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  insightsCluster: {
    marginTop: theme.spacing.md,
  },
  sectionToggles: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  sectionToggleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 140,
    minHeight: 64,
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.xs,
  },
  metricLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metricIcon: {
    width: 18,
  },
  metricValue: {
    paddingLeft: 22,
  },
  emptyState: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    marginTop: theme.spacing.xl,
  },
  insightStoryGrid: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  insightStoryCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  insightStoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  insightStoryIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightStoryBody: {
    gap: theme.spacing.xs,
  },
  surfaceCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
  },
  chartSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chartHighlightCard: {
    backgroundColor: theme.colors.primaryBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  chartHighlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  chartHighlightEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
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
    paddingVertical: theme.spacing.xs,
  },
  legendText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionEmptyCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  sectionEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryBackground,
  },
  sectionEmptyText: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
});
