import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacer } from '../ui/Spacer';
import { Typography } from '../ui/Typography';

interface ProgressBarProps {
  label: string;
  spent: number;
  limit: number;
  color: string;
}

function ProgressBar({ label, spent, limit, color }: ProgressBarProps) {
  const s = Number(spent) || 0;
  const l = Number(limit) || 0;
  const percentage = l > 0 ? Math.min((s / l) * 100, 100) : 0;
  const isOverBudget = s > l;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Typography variant="caption" weight="semibold">
          {label}
        </Typography>
        <Typography variant="caption" color={isOverBudget ? theme.colors.expense : theme.colors.secondaryText}>
          R${s.toFixed(0)} / R${l.toFixed(0)}
        </Typography>
      </View>
      <Spacer size="xs" />
      <View style={styles.track}>
        <View 
          style={[
            styles.fill, 
            { backgroundColor: isOverBudget ? theme.colors.expense : color, width: `${percentage}%` }
          ]} 
        />
      </View>
    </View>
  );
}

export function BudgetRuleWidget() {
  const transactions = useExpenseStore((state) => state.transactions);

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const needsKeywords = ['food', 'comida', 'mercado', 'housing', 'casa', 'aluguel', 'transport', 'transporte', 'saúde', 'conta', 'luz', 'agua'];
  const savingsKeywords = ['investimento', 'poupança', 'reserva', 'saving'];

  let spentNeeds = 0;
  let spentWants = 0;
  let spentSavings = 0;

  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const cat = t.category.toLowerCase();
    const amount = Number(t.amount);
    const isNeed = needsKeywords.some((k) => cat.includes(k));
    const isSaving = savingsKeywords.some((k) => cat.includes(k));

    if (isSaving) spentSavings += amount;
    else if (isNeed) spentNeeds += amount;
    else spentWants += amount;
  });

  const limitNeeds = income * 0.5;
  const limitWants = income * 0.3;
  const limitSavings = income * 0.2;

  if (income === 0) return null;

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="bold">
        Regra 50/30/20
      </Typography>
      <Typography variant="caption" color={theme.colors.secondaryText}>
        Como seu gasto atual consome suas receitas:
      </Typography>
      <Spacer size="md" />
      
      <ProgressBar label="Essenciais (50%)" spent={spentNeeds} limit={limitNeeds} color={theme.colors.info} />
      <Spacer size="sm" />
      <ProgressBar label="Desejos/Livres (30%)" spent={spentWants} limit={limitWants} color={theme.colors.accent} />
      <Spacer size="sm" />
      <ProgressBar label="Poupança/Acúmulo (20%)" spent={spentSavings} limit={limitSavings} color={theme.colors.income} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  }
});
