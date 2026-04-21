import { AppDialog } from '@/src/components/ui/AppDialog';
import { Badge } from '@/src/components/ui/Badge';
import { CategoryIcon } from '@/src/components/ui/CategoryIcon';
import { getCategoryMeta } from '@/src/constants/categories';
import { getPendingTransactionId } from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { PendingMutation, Transaction } from '@/src/types';
import { formatCurrency, formatFriendlyDate } from '@/src/utils/formatters';
import { impactFeedback, warningFeedback } from '@/src/utils/haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { useShallow } from 'zustand/react/shallow';

interface Props {
  transaction: Transaction;
  onDeleted?: () => void;
}

function getPendingLabel(transaction: Transaction, pendingMutations: PendingMutation[]) {
  const pending = pendingMutations.find((mutation) => {
    return getPendingTransactionId(mutation) === transaction.id;
  });

  if (!pending) return null;

  if (pending.type === 'create') return 'Criação pendente';
  if (pending.type === 'update') return 'Edição pendente';
  return 'Remoção pendente';
}

export function TransactionItem({ transaction, onDeleted }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const isIncome = transaction.type === 'income';
  const { pendingMutations, removeTransaction } = useExpenseStore(
    useShallow((state) => ({
      pendingMutations: state.pendingMutations,
      removeTransaction: state.removeTransaction,
    }))
  );
  const categoryMeta = getCategoryMeta(transaction.category);
  const pendingLabel = getPendingLabel(transaction, pendingMutations);

  const formattedAmount = formatCurrency(transaction.amount);

  const dateStr = formatFriendlyDate(transaction.date);

  const handleDelete = () => {
    swipeableRef.current?.close();
    setIsDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    warningFeedback();
    swipeableRef.current?.close();
    removeTransaction(transaction.id);
    setIsDeleteDialogVisible(false);
    onDeleted?.();
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    router.push({
      pathname: '/modal',
      params: { 
        editId: transaction.id,
        editAmount: transaction.amount.toString(),
        editDescription: transaction.description,
        editCategory: transaction.category,
        editType: transaction.type,
        editDate: transaction.date,
      }
    });
  };

  const handleOpenDetails = () => {
    impactFeedback();
    router.push({
      pathname: '/transaction/[id]',
      params: { id: transaction.id },
    });
  };

  const renderLeftActions = () => {
    return (
      <TouchableOpacity 
        style={styles.editAction} 
        onPress={handleEdit}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${transaction.description}`}
      >
        <Typography variant="body" weight="bold" color={theme.colors.background}>
          Editar
        </Typography>
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={handleDelete}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Apagar ${transaction.description}`}
      >
        <Typography variant="body" weight="bold" color={theme.colors.background}>
          Apagar
        </Typography>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <TouchableOpacity
          style={styles.container}
          onPress={handleOpenDetails}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Abrir detalhes de ${transaction.description}, ${categoryMeta.label}, ${formattedAmount}`}
        >
          <View style={styles.leftContent}>
            <View style={[styles.iconFrame, { borderColor: categoryMeta.color }]}>
              <CategoryIcon category={categoryMeta} />
            </View>
            <Spacer horizontal size="md" />
            <View style={styles.textContent}>
              <Typography
                variant="body"
                weight="semibold"
                numberOfLines={1}
                color={theme.colors.primaryText}
              >
                {transaction.description}
              </Typography>
              <Spacer size="xs" />
              <Typography
                variant="caption"
                color={categoryMeta.color}
                weight="semibold"
                numberOfLines={1}
              >
                {categoryMeta.label}
              </Typography>
              <Spacer size="xs" />
              <Typography variant="caption" color={theme.colors.secondaryText} numberOfLines={1}>
                {dateStr}
              </Typography>
              {pendingLabel && (
                <>
                  <Spacer size="xs" />
                  <Badge label={pendingLabel} variant="warning" style={styles.pendingBadge} />
                </>
              )}
            </View>
          </View>

          <View style={styles.amountBlock}>
            <Typography
              variant="body"
              weight="bold"
              color={isIncome ? theme.colors.income : theme.colors.expense}
              align="right"
              style={styles.amount}
              numberOfLines={1}
            >
              {isIncome ? '+' : '-'}{formattedAmount}
            </Typography>
            <Typography variant="caption" color={theme.colors.secondaryText} align="right">
              {isIncome ? 'Receita' : 'Despesa'}
            </Typography>
          </View>
        </TouchableOpacity>
      </Swipeable>

      <AppDialog
        visible={isDeleteDialogVisible}
        variant="warning"
        title="Apagar transação?"
        message="Essa ação não pode ser desfeita."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        isDanger
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />

    </>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    backgroundColor: theme.colors.expense,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 84,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  leftContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.md,
  },
  iconFrame: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.pill,
  },
  amountBlock: {
    minWidth: 92,
    maxWidth: 116,
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  amount: {
    width: '100%',
  },
  editAction: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: 100,
    paddingLeft: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  deleteAction: {
    backgroundColor: theme.colors.expense,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    paddingRight: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  }
});
