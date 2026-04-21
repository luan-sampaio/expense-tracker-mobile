import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { Input } from '@/src/components/ui/Input';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { isGoalContribution, isSpendingExpense, isTransactionWithinPeriod, sumTransactionsByType } from '@/src/domain/transactions';
import { DEFAULT_BUDGET_SETTINGS, useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { BudgetAllocation, BudgetGroupId, BudgetPresetId, BudgetSettings } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';
import { impactFeedback } from '@/src/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const GROUP_COLORS = [
  theme.colors.info,
  theme.colors.accent,
  theme.colors.income,
  theme.colors.primary,
  theme.colors.expense,
];

const BUDGET_PRESETS: {
  id: BudgetPresetId;
  label: string;
  description: string;
  allocations: BudgetAllocation[];
}[] = [
  {
    id: 'classic',
    label: '50/30/20',
    description: 'Equilibrado para essenciais, livres e prioridade financeira.',
    allocations: [
      {
        groupId: 'needs',
        label: 'Essenciais',
        percentage: 50,
      },
      {
        groupId: 'wants',
        label: 'Livres',
        percentage: 30,
      },
      {
        groupId: 'savings',
        label: 'Prioridade financeira',
        percentage: 20,
      },
    ],
  },
  {
    id: 'essential',
    label: '60/20/20',
    description: 'Mais folga para gastos fixos do mês.',
    allocations: [
      {
        groupId: 'needs',
        label: 'Essenciais',
        percentage: 60,
      },
      {
        groupId: 'wants',
        label: 'Livres',
        percentage: 20,
      },
      {
        groupId: 'savings',
        label: 'Prioridade financeira',
        percentage: 20,
      },
    ],
  },
  {
    id: 'savings',
    label: '50/20/30',
    description: 'Prioriza guardar mais dinheiro.',
    allocations: [
      {
        groupId: 'needs',
        label: 'Essenciais',
        percentage: 50,
      },
      {
        groupId: 'wants',
        label: 'Livres',
        percentage: 20,
      },
      {
        groupId: 'savings',
        label: 'Prioridade financeira',
        percentage: 30,
      },
    ],
  },
];

interface ProgressBarProps {
  allocation: BudgetAllocation;
  spent: number;
  income: number;
  color: string;
}

function getPresetLabel(settings: BudgetSettings) {
  if (settings.presetId === 'custom') return 'Personalizado';

  return BUDGET_PRESETS.find((preset) => preset.id === settings.presetId)?.label ?? 'Orçamento';
}

function normalizeAllocations(allocations: BudgetAllocation[]) {
  const source = allocations.length > 0 ? allocations : DEFAULT_BUDGET_SETTINGS.allocations;

  return source.map((allocation, index) => ({
    groupId: allocation.groupId || `group-${index + 1}`,
    label: allocation.label?.trim() || `Grupo ${index + 1}`,
    percentage: Number(allocation.percentage) || 0,
  }));
}

function getGroupColor(groupId: BudgetGroupId, index: number) {
  if (groupId === 'needs') return theme.colors.info;
  if (groupId === 'wants') return theme.colors.accent;
  if (groupId === 'savings') return theme.colors.income;

  return GROUP_COLORS[index % GROUP_COLORS.length];
}

function ProgressBar({ allocation, spent, income, color }: ProgressBarProps) {
  const limit = income * (allocation.percentage / 100);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverTarget = limit > 0 && spent > limit;
  const isFinancialPriority = allocation.groupId === 'savings';
  const hasReachedPriorityTarget = isFinancialPriority && limit > 0 && spent >= limit;
  const hasStatus = isOverTarget || hasReachedPriorityTarget;
  const shouldWarn = isOverTarget && !isFinancialPriority;
  const statusLabel = shouldWarn
    ? 'Acima do limite · '
    : hasReachedPriorityTarget
      ? isOverTarget
        ? 'Meta superada · '
        : 'Meta atingida · '
      : '';
  const statusColor = shouldWarn ? theme.colors.expense : theme.colors.secondaryText;
  const progressColor = shouldWarn ? theme.colors.expense : color;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Typography variant="caption" weight="semibold">
          {allocation.label} ({allocation.percentage}%)
        </Typography>
        <View style={styles.progressValue}>
          {hasStatus && (
            <MaterialIcons
              name={isFinancialPriority ? 'check-circle' : 'warning'}
              size={15}
              color={isFinancialPriority ? theme.colors.income : theme.colors.expense}
            />
          )}
          <Typography
            variant="caption"
            weight={hasStatus ? 'semibold' : 'regular'}
            color={hasReachedPriorityTarget ? theme.colors.income : statusColor}
          >
            {statusLabel}{formatCurrency(spent)} / {formatCurrency(limit)}
          </Typography>
        </View>
      </View>
      <Spacer size="xs" />
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: progressColor,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function BudgetRuleWidget() {
  const {
    transactions,
    budgetSettings,
    setBudgetSettings,
    setBudgetVisibility,
  } = useExpenseStore(
    useShallow((state) => ({
      transactions: state.transactions,
      budgetSettings: state.budgetSettings,
      setBudgetSettings: state.setBudgetSettings,
      setBudgetVisibility: state.setBudgetVisibility,
    }))
  );
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [draftSettings, setDraftSettings] = useState<BudgetSettings>(budgetSettings);
  const [settingsError, setSettingsError] = useState('');

  const allocations = useMemo(() => {
    return normalizeAllocations(budgetSettings.allocations);
  }, [budgetSettings.allocations]);
  const budget = useMemo(() => {
    const monthTransactions = transactions.filter((transaction) => {
      return isTransactionWithinPeriod(transaction.date, 'month');
    });
    const income = sumTransactionsByType(monthTransactions, 'income');
    const currentAllocations = normalizeAllocations(budgetSettings.allocations);
    const spentByGroup = currentAllocations.reduce<Record<BudgetGroupId, number>>((groups, allocation) => {
      groups[allocation.groupId] = 0;
      return groups;
    }, {});

    monthTransactions.filter(isSpendingExpense).forEach((transaction) => {
      const category = getCategoryMeta(transaction.category);
      const matchedAllocation = currentAllocations.find((allocation) => {
        return allocation.groupId === transaction.budgetGroupId;
      });
      const fallbackAllocation = currentAllocations.find((allocation) => {
        return allocation.groupId === category.budgetGroup;
      });
      const groupId = matchedAllocation?.groupId
        ?? fallbackAllocation?.groupId
        ?? currentAllocations[0]?.groupId;

      if (!groupId) return;
      spentByGroup[groupId] += transaction.amount;
    });

    monthTransactions.filter(isGoalContribution).forEach((transaction) => {
      const priorityGroupId = currentAllocations.find((allocation) => allocation.groupId === 'savings')?.groupId
        ?? currentAllocations[0]?.groupId;

      if (!priorityGroupId) return;
      spentByGroup[priorityGroupId] += transaction.amount;
    });

    return {
      income,
      spentByGroup,
    };
  }, [budgetSettings.allocations, transactions]);

  const draftTotal = useMemo(() => {
    return normalizeAllocations(draftSettings.allocations).reduce((total, allocation) => {
      return total + allocation.percentage;
    }, 0);
  }, [draftSettings.allocations]);
  const isCustomDraft = draftSettings.presetId === 'custom';

  const openSettings = () => {
    impactFeedback();
    setDraftSettings({
      ...budgetSettings,
      allocations,
    });
    setSettingsError('');
    setIsSettingsVisible(true);
  };

  const applyPreset = (presetId: BudgetPresetId) => {
    impactFeedback();

    if (presetId === 'custom') {
      setDraftSettings((current) => ({
        ...current,
        presetId: 'custom',
        allocations: normalizeAllocations(current.allocations),
      }));
      return;
    }

    const preset = BUDGET_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setDraftSettings({
      isVisible: true,
      presetId,
      allocations: preset.allocations,
    });
  };

  const updateDraftPercentage = (groupId: BudgetGroupId, value: string) => {
    const percentage = Math.min(Number(value.replace(/\D/g, '')) || 0, 100);

    setDraftSettings((current) => ({
      ...current,
      presetId: 'custom',
      allocations: normalizeAllocations(current.allocations).map((allocation) => {
        if (allocation.groupId !== groupId) return allocation;

        return {
          ...allocation,
          percentage,
        };
      }),
    }));
  };

  const updateDraftLabel = (groupId: BudgetGroupId, label: string) => {
    setDraftSettings((current) => ({
      ...current,
      presetId: 'custom',
      allocations: normalizeAllocations(current.allocations).map((allocation) => {
        if (allocation.groupId !== groupId) return allocation;

        return {
          ...allocation,
          label,
        };
      }),
    }));
  };

  const addDraftGroup = () => {
    const groupId = `custom-${Date.now()}`;

    setDraftSettings((current) => ({
      ...current,
      presetId: 'custom',
      allocations: [
        ...normalizeAllocations(current.allocations),
        {
          groupId,
          label: 'Novo grupo',
          percentage: 0,
        },
      ],
    }));
  };

  const removeDraftGroup = (groupId: BudgetGroupId) => {
    setDraftSettings((current) => {
      const nextAllocations = normalizeAllocations(current.allocations).filter((allocation) => {
        return allocation.groupId !== groupId;
      });

      return {
        ...current,
        presetId: 'custom',
        allocations: nextAllocations.length > 0 ? nextAllocations : normalizeAllocations(current.allocations),
      };
    });
  };

  const saveSettings = () => {
    const nextAllocations = normalizeAllocations(draftSettings.allocations);
    const total = nextAllocations.reduce((sum, allocation) => sum + allocation.percentage, 0);

    if (total !== 100) {
      setSettingsError('A soma dos percentuais precisa ser 100%.');
      return;
    }

    const hasEmptyLabel = nextAllocations.some((allocation) => allocation.label.trim().length === 0);
    if (hasEmptyLabel) {
      setSettingsError('Todos os grupos precisam ter nome.');
      return;
    }

    setBudgetSettings({
      ...draftSettings,
      isVisible: true,
      allocations: nextAllocations,
    });
    setIsSettingsVisible(false);
  };

  const hideWidget = () => {
    impactFeedback();
    setBudgetVisibility(false);
    setIsSettingsVisible(false);
  };

  if (!budgetSettings.isVisible) {
    return (
      <Button
        label="Mostrar orçamento"
        variant="secondary"
        iconName="visibility"
        onPress={() => setBudgetVisibility(true)}
      />
    );
  }

  if (budget.income === 0) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography variant="body" weight="bold" style={styles.headerTitle}>
            Orçamento {getPresetLabel(budgetSettings)}
          </Typography>
          <View style={styles.headerActions}>
            <Button
              label="Ocultar"
              variant="ghost"
              size="sm"
              iconName="visibility-off"
              onPress={hideWidget}
              accessibilityLabel="Ocultar orçamento"
            />
            <Button
              label="Ajustar"
              variant="ghost"
              size="sm"
              iconName="settings"
              onPress={openSettings}
            />
          </View>
        </View>
        <Spacer size="xs" />
        <Typography variant="caption" color={theme.colors.secondaryText}>
          Metas do mês baseadas nas receitas e nos grupos escolhidos em cada despesa.
        </Typography>
        <Spacer size="md" />

        {allocations.map((allocation, index) => (
          <React.Fragment key={allocation.groupId}>
            <ProgressBar
              allocation={allocation}
              spent={budget.spentByGroup[allocation.groupId]}
              income={budget.income}
              color={getGroupColor(allocation.groupId, index)}
            />
            <Spacer size="sm" />
          </React.Fragment>
        ))}
      </View>

      <Modal
        visible={isSettingsVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsSettingsVisible(false)}>
          <Pressable
            style={styles.sheet}
            accessibilityRole="summary"
            accessibilityLabel="Configurar orçamento mensal"
          >
            <View style={styles.sheetHeader}>
              <View style={styles.headerText}>
                <Typography variant="title" weight="bold">
                  Orçamento mensal
                </Typography>
                <Typography variant="body" color={theme.colors.secondaryText}>
                  Escolha uma regra ou personalize grupos e percentuais.
                </Typography>
              </View>
              <Button
                label="Fechar"
                variant="ghost"
                size="sm"
                iconName="close"
                onPress={() => setIsSettingsVisible(false)}
              />
            </View>

            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent}>
              <Typography variant="body" weight="semibold">
                Modelo
              </Typography>
              <View style={styles.presetGrid}>
                {BUDGET_PRESETS.map((preset) => (
                  <Chip
                    key={preset.id}
                    label={preset.label}
                    size="sm"
                    selected={draftSettings.presetId === preset.id}
                    onPress={() => applyPreset(preset.id)}
                    accessibilityLabel={`${preset.label}. ${preset.description}`}
                  />
                ))}
                <Chip
                  label="Personalizado"
                  size="sm"
                  selected={draftSettings.presetId === 'custom'}
                  onPress={() => applyPreset('custom')}
                />
              </View>

              {isCustomDraft ? (
                <>
                  {normalizeAllocations(draftSettings.allocations).map((allocation, index) => (
                    <View key={allocation.groupId} style={styles.groupEditor}>
                      <View style={styles.groupEditorHeader}>
                        <View style={[styles.groupColorDot, { backgroundColor: getGroupColor(allocation.groupId, index) }]} />
                        <View style={styles.groupEditorTitle}>
                          <Typography variant="body" weight="bold">
                            {allocation.label || `Grupo ${index + 1}`}
                          </Typography>
                          <Typography variant="caption" color={theme.colors.secondaryText}>
                            {allocation.percentage}%
                          </Typography>
                        </View>
                        {normalizeAllocations(draftSettings.allocations).length > 1 && (
                          <Button
                            label="Remover"
                            variant="ghost"
                            size="sm"
                            iconName="delete"
                            onPress={() => removeDraftGroup(allocation.groupId)}
                          />
                        )}
                      </View>
                      <View style={styles.groupFields}>
                        <Input
                          label="Nome"
                          value={allocation.label}
                          onChangeText={(value) => updateDraftLabel(allocation.groupId, value)}
                          accessibilityLabel={`Nome do grupo ${index + 1}`}
                          containerStyle={styles.groupNameInput}
                        />
                        <Input
                          label="Percentual"
                          value={String(allocation.percentage)}
                          keyboardType="number-pad"
                          onChangeText={(value) => updateDraftPercentage(allocation.groupId, value)}
                          accessibilityLabel={`Percentual para ${allocation.label}`}
                          containerStyle={styles.groupPercentInput}
                        />
                      </View>
                    </View>
                  ))}
                  <Button
                    label="Adicionar grupo"
                    variant="secondary"
                    iconName="add"
                    onPress={addDraftGroup}
                  />
                </>
              ) : (
                <View style={styles.presetSummary}>
                  {normalizeAllocations(draftSettings.allocations).map((allocation, index) => (
                    <View key={allocation.groupId} style={styles.summaryRow}>
                      <View style={[styles.groupColorDot, { backgroundColor: getGroupColor(allocation.groupId, index) }]} />
                      <Typography variant="body" weight="semibold" style={styles.summaryLabel}>
                        {allocation.label}
                      </Typography>
                      <Typography variant="body" weight="bold" color={theme.colors.secondaryText}>
                        {allocation.percentage}%
                      </Typography>
                    </View>
                  ))}
                  <Typography variant="caption" color={theme.colors.secondaryText}>
                    Para editar nomes ou percentuais, selecione Personalizado.
                  </Typography>
                </View>
              )}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Typography
                variant="caption"
                weight="semibold"
                color={draftTotal === 100 ? theme.colors.success : theme.colors.expense}
              >
                Total: {draftTotal}%
              </Typography>
              {settingsError && (
                <Typography variant="caption" weight="semibold" color={theme.colors.expense}>
                  {settingsError}
                </Typography>
              )}

              <View style={styles.actions}>
                <Button
                  label="Ocultar"
                  variant="secondary"
                  onPress={hideWidget}
                  style={styles.actionButton}
                />
                <Button
                  label="Salvar"
                  onPress={saveSettings}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    paddingTop: theme.spacing.xs,
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
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(45, 42, 38, 0.42)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    alignSelf: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sheetScroll: {
    maxHeight: 480,
  },
  sheetContent: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sheetFooter: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  presetSummary: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceElevated,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  summaryLabel: {
    flex: 1,
  },
  groupEditor: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceElevated,
  },
  groupEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  groupColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  groupEditorTitle: {
    flex: 1,
    minWidth: 0,
  },
  groupFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  groupNameInput: {
    flex: 2,
    minWidth: 160,
  },
  groupPercentInput: {
    flex: 1,
    minWidth: 112,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 128,
  },
});
