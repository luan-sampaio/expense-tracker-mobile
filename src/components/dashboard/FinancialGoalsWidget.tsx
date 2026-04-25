import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { isGoalContribution } from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { FinancialGoal } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

function parseGoalAmount(value: string) {
  const digits = value.replace(/\D/g, '');
  return Number(digits || '0') / 100;
}

function formatGoalInput(value: number) {
  return value > 0 ? formatCurrency(value) : '';
}

export function FinancialGoalsWidget() {
  const {
    addFinancialGoal,
    financialGoals,
    financialGoalsSettings,
    removeFinancialGoal,
    setFinancialGoalsVisibility,
    transactions,
    updateFinancialGoal,
  } = useExpenseStore(
    useShallow((state) => ({
      addFinancialGoal: state.addFinancialGoal,
      financialGoals: state.financialGoals,
      financialGoalsSettings: state.financialGoalsSettings,
      removeFinancialGoal: state.removeFinancialGoal,
      setFinancialGoalsVisibility: state.setFinancialGoalsVisibility,
      transactions: state.transactions,
      updateFinancialGoal: state.updateFinancialGoal,
    }))
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const goalsWithProgress = useMemo(() => {
    return financialGoals.map((goal) => {
      const currentAmount = transactions
        .filter((transaction) => isGoalContribution(transaction) && transaction.goalId === goal.id)
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        ...goal,
        currentAmount,
        progress: goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0,
      };
    });
  }, [financialGoals, transactions]);

  const openCreate = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmount('');
    setIsModalVisible(true);
  };

  const openEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(formatGoalInput(goal.targetAmount));
    setIsModalVisible(true);
  };

  const saveGoal = () => {
    const name = goalName.trim();
    const amount = parseGoalAmount(targetAmount);

    if (!name || amount <= 0) return;

    if (editingGoal) {
      updateFinancialGoal(editingGoal.id, { name, targetAmount: amount });
    } else {
      addFinancialGoal({ name, targetAmount: amount });
    }

    setIsModalVisible(false);
  };

  if (!financialGoalsSettings.isVisible) {
    return (
      <Button
        label="Mostrar metas"
        variant="secondary"
        iconName="visibility"
        onPress={() => setFinancialGoalsVisibility(true)}
      />
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerEyebrow}>
          <MaterialIcons name="flag-circle" size={16} color={theme.colors.primary} />
          <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
            Planejamento financeiro
          </Typography>
        </View>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Typography variant="title" weight="bold">
              Metas financeiras
            </Typography>
            <Typography variant="body" color={theme.colors.secondaryText}>
              Acompanhe reservas, investimentos e objetivos.
            </Typography>
          </View>
          <View style={styles.headerActions}>
            <Button
              label="Ocultar"
              variant="ghost"
              size="sm"
              iconName="visibility-off"
              onPress={() => setFinancialGoalsVisibility(false)}
              accessibilityLabel="Ocultar metas financeiras"
            />
            <Button label="Nova" size="sm" iconName="add" onPress={openCreate} />
          </View>
        </View>

        {goalsWithProgress.length === 0 ? (
          <>
            <Spacer size="md" />
            <View style={styles.emptyState}>
              <MaterialIcons name="flag" size={20} color={theme.colors.primary} />
              <Typography variant="caption" color={theme.colors.secondaryText}>
                Crie uma meta para associar aportes ao lançar uma despesa.
              </Typography>
            </View>
          </>
        ) : (
          <View style={styles.goalList}>
            {goalsWithProgress.map((goal) => (
              <Pressable
                key={goal.id}
                style={styles.goalItem}
                onPress={() => openEdit(goal)}
                accessibilityRole="button"
                accessibilityLabel={`Editar meta ${goal.name}`}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleBlock}>
                    <View style={styles.goalIconWrap}>
                      <MaterialIcons name="flag" size={18} color={theme.colors.primary} />
                    </View>
                    <Typography variant="body" weight="semibold" style={styles.goalName}>
                      {goal.name}
                    </Typography>
                  </View>
                  <View style={styles.goalPercentBadge}>
                    <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
                      {goal.progress.toFixed(0)}%
                    </Typography>
                  </View>
                </View>
                <Spacer size="xs" />
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${goal.progress}%` }]} />
                </View>
                <Spacer size="xs" />
                <View style={styles.goalValues}>
                  <View style={styles.goalValueChip}>
                    <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
                      Guardado {formatCurrency(goal.currentAmount)}
                    </Typography>
                  </View>
                  <View style={styles.goalValueChip}>
                    <Typography variant="caption" weight="semibold" color={theme.colors.secondaryText}>
                      Meta {formatCurrency(goal.targetAmount)}
                    </Typography>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsModalVisible(false)}>
          <Pressable style={styles.dialog} accessibilityRole="summary">
            <Typography variant="title" weight="bold">
              {editingGoal ? 'Editar meta' : 'Nova meta'}
            </Typography>
            <Spacer size="lg" />
            <Input
              label="Nome"
              value={goalName}
              placeholder="Ex: Reserva de emergência"
              onChangeText={setGoalName}
            />
            <Spacer size="md" />
            <Input
              label="Valor alvo"
              value={targetAmount}
              placeholder="R$ 0,00"
              keyboardType="number-pad"
              onChangeText={(value) => setTargetAmount(formatGoalInput(parseGoalAmount(value)))}
            />
            <Spacer size="lg" />
            <View style={styles.actions}>
              {editingGoal && (
                <Button
                  label="Excluir"
                  variant="secondary"
                  onPress={() => {
                    removeFinancialGoal(editingGoal.id);
                    setIsModalVisible(false);
                  }}
                  style={styles.actionButton}
                />
              )}
              <Button
                label="Salvar"
                onPress={saveGoal}
                style={styles.actionButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  headerEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  goalList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  goalItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadows.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  goalTitleBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  goalIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryBackground,
  },
  goalName: {
    flex: 1,
  },
  goalPercentBadge: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.primaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSecondary,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  goalValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  goalValueChip: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(45, 42, 38, 0.42)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
});
