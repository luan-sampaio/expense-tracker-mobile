import { Container } from '@/src/components/ui/Container';
import { Period, PeriodFilter } from '@/src/components/ui/PeriodFilter';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { groupExpensesByCategory } from '@/src/domain/transactions';
import { useFilteredTransactions } from '@/src/hooks/useFilteredTransactions';
import { theme } from '@/src/styles/theme';
import { formatCurrency } from '@/src/utils/formatters';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

export default function ExploreScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const { width } = useWindowDimensions();
  const isNarrowScreen = width <= 380;
  const chartWidth = Math.max(width - theme.spacing.lg * 2, 260);
  const chartHeight = isNarrowScreen ? 190 : 220;
  const filteredTransactions = useFilteredTransactions(selectedPeriod);

  const expensesByCategory = useMemo(
    () => groupExpensesByCategory(filteredTransactions),
    [filteredTransactions]
  );

  const chartData = useMemo(() => {
    return Object.keys(expensesByCategory).map((categoryName) => {
      const categoryMeta = getCategoryMeta(categoryName);

      return {
        name: categoryMeta.label,
        population: expensesByCategory[categoryName],
        color: categoryMeta.color,
        legendFontColor: theme.colors.primaryText,
        legendFontSize: 14,
      };
    }).sort((a, b) => b.population - a.population);
  }, [expensesByCategory]);

  const totalExpenses = useMemo(
    () => Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
    [expensesByCategory]
  );

  const chartConfig = {
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Spacer size="xxl" />
        <Container padding="lg" flex={0}>
          <Typography variant="heading" weight="bold">
            Visão Geral
          </Typography>
          <Typography variant="body" color={theme.colors.secondaryText}>
            Distribuição dos seus gastos
          </Typography>
          <Spacer size="lg" />
          <PeriodFilter 
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
          />
        </Container>
        
        <Spacer size="xl" />

        {chartData.length === 0 ? (
          <Container padding="lg" flex={0}>
            <View style={styles.emptyCard}>
              <Typography variant="body" color={theme.colors.secondaryText} align="center">
                Adicione despesas para visualizar o seu gráfico.
              </Typography>
            </View>
          </Container>
        ) : (
          <View style={styles.chartWrapper}>
            <PieChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={isNarrowScreen ? "4" : "15"}
              hasLegend={!isNarrowScreen}
              absolute 
            />
            {isNarrowScreen && (
              <View style={styles.legendList}>
                {chartData.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Typography variant="caption" color={theme.colors.secondaryText} numberOfLines={1} style={styles.legendName}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" weight="semibold" color={theme.colors.primaryText}>
                      {formatCurrency(item.population)}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Spacer size="xl" />

        <Container padding="lg" flex={0}>
          <Typography variant="title" weight="semibold">
            Resumo de Gastos
          </Typography>
          <Spacer size="md" />
          <View style={styles.summaryBox}>
            <Typography variant="body" weight="medium">
              Total Acumulado
            </Typography>
            <Typography variant="heading" weight="bold" color={theme.colors.expense}>
              {formatCurrency(totalExpenses)}
            </Typography>
          </View>
        </Container>

      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.lg,
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
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  summaryBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  }
});
