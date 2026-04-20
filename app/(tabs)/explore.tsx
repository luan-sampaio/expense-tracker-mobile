import { Container } from '@/src/components/ui/Container';
import { Period, PeriodFilter } from '@/src/components/ui/PeriodFilter';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { useFilteredTransactions } from '@/src/hooks/useFilteredTransactions';
import { theme } from '@/src/styles/theme';
import { formatCurrency } from '@/src/utils/formatters';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ExploreScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const filteredTransactions = useFilteredTransactions(selectedPeriod);

  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, current) => {
      const cat = current.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += current.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map((categoryName) => {
    const categoryMeta = getCategoryMeta(categoryName);

    return {
      name: categoryMeta.label,
      population: expensesByCategory[categoryName],
      color: categoryMeta.color,
      legendFontColor: theme.colors.primaryText,
      legendFontSize: 14,
    };
  }).sort((a, b) => b.population - a.population);

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

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
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute 
            />
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
