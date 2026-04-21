import { isTransactionWithinPeriod, sumTransactionsByType } from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { formatCurrency } from '@/src/utils/formatters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';

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
        <View style={styles.progressValue}>
          {isOverBudget && (
            <MaterialIcons name="warning" size={15} color={theme.colors.expense} />
          )}
          <Typography
            variant="caption"
            weight={isOverBudget ? 'semibold' : 'regular'}
            color={isOverBudget ? theme.colors.expense : theme.colors.secondaryText}
          >
            {isOverBudget ? 'Acima do limite · ' : ''}{formatCurrency(s)} / {formatCurrency(l)}
          </Typography>
        </View>
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

const NEEDS_KEYWORDS = ['food', 'comida', 'mercado', 'housing', 'casa', 'aluguel', 'transport', 'transporte', 'saúde', 'conta', 'luz', 'agua'];
const SAVINGS_KEYWORDS = ['investimento', 'poupança', 'reserva', 'saving'];

export function BudgetRuleWidget() {
  const transactions = useExpenseStore((state) => state.transactions);

  const budget = useMemo(() => {
    const monthTransactions = transactions.filter((transaction) => {
      return isTransactionWithinPeriod(transaction.date, 'month');
    });
    const income = sumTransactionsByType(monthTransactions, 'income');
    let spentNeeds = 0;
    let spentWants = 0;
    let spentSavings = 0;

    monthTransactions.filter((t) => t.type === 'expense').forEach((t) => {
      const cat = t.category.toLowerCase();
      const amount = t.amount;
      const isNeed = NEEDS_KEYWORDS.some((k) => cat.includes(k));
      const isSaving = SAVINGS_KEYWORDS.some((k) => cat.includes(k));

      if (isSaving) spentSavings += amount;
      else if (isNeed) spentNeeds += amount;
      else spentWants += amount;
    });

    return {
      income,
      spentNeeds,
      spentWants,
      spentSavings,
      limitNeeds: income * 0.5,
      limitWants: income * 0.3,
      limitSavings: income * 0.2,
    };
  }, [transactions]);

  if (budget.income === 0) return null;

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="bold">
        Regra 50/30/20
      </Typography>
      <Typography variant="caption" color={theme.colors.secondaryText}>
        Distribuição do mês atual com base nas suas receitas:
      </Typography>
      <Spacer size="md" />
      
      <ProgressBar label="Essenciais (50%)" spent={budget.spentNeeds} limit={budget.limitNeeds} color={theme.colors.info} />
      <Spacer size="sm" />
      <ProgressBar label="Desejos/Livres (30%)" spent={budget.spentWants} limit={budget.limitWants} color={theme.colors.accent} />
      <Spacer size="sm" />
      <ProgressBar label="Poupança/Acúmulo (20%)" spent={budget.spentSavings} limit={budget.limitSavings} color={theme.colors.income} />
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
    gap: theme.spacing.sm,
  },
  progressValue: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
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
  },
});
