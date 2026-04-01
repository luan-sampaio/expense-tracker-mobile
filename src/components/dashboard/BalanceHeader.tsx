import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { theme } from '@/src/styles/theme';
import { useExpenseStore } from '@/src/store/useExpenseStore';

export function BalanceHeader() {
  const transactions = useExpenseStore((state) => state.transactions);
  
  const balance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(balance);

  return (
    <View style={styles.container}>
      <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
        Saldo Total
      </Typography>
      <Typography variant="hero" weight="bold" color={theme.colors.primaryText}>
        {formattedBalance}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
