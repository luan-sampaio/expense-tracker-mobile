import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacer } from '../ui/Spacer';
import { Typography } from '../ui/Typography';

export function BalanceHeader() {
  const transactions = useExpenseStore((state) => state.transactions);
  
  const balance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const fmt = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
          Saldo Total
        </Typography>
        <Spacer size="xs" />
        <Typography variant="hero" weight="bold" color={theme.colors.primaryText}>
          {fmt(balance)}
        </Typography>
        <Spacer size="lg" />
        <View style={styles.row}>
          <View style={styles.miniCard}>
            <View style={[styles.dot, { backgroundColor: theme.colors.income }]} />
            <View>
              <Typography variant="caption" color={theme.colors.secondaryText}>Receitas</Typography>
              <Typography variant="body" weight="semibold" color={theme.colors.income}>
                {fmt(totalIncome)}
              </Typography>
            </View>
          </View>
          <View style={styles.miniCard}>
            <View style={[styles.dot, { backgroundColor: theme.colors.expense }]} />
            <View>
              <Typography variant="caption" color={theme.colors.secondaryText}>Despesas</Typography>
              <Typography variant="body" weight="semibold" color={theme.colors.expense}>
                {fmt(totalExpense)}
              </Typography>
            </View>
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
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
