import { getCategoryMeta } from '@/src/constants/categories';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { Transaction } from '@/src/types';
import { formatCurrency, formatShortDate } from '@/src/utils/formatters';
import { warningFeedback } from '@/src/utils/haptics';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Spacer } from '../ui/Spacer';
import { Typography } from '../ui/Typography';

interface Props {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: Props) {
  const isIncome = transaction.type === 'income';
  const removeTransaction = useExpenseStore((state) => state.removeTransaction);
  const categoryMeta = getCategoryMeta(transaction.category);

  const formattedAmount = formatCurrency(transaction.amount);

  const dateStr = formatShortDate(transaction.date);

  const handleDelete = () => {
    Alert.alert('Apagar transação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          warningFeedback();
          removeTransaction(transaction.id);
        },
      },
    ]);
  };

  const handleEdit = () => {
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
    <Swipeable 
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
          <View style={[
            styles.iconPlaceholder, 
            { backgroundColor: categoryMeta.backgroundColor }
          ]}>
             <Typography variant="title" weight="bold" color={categoryMeta.color}>
                {categoryMeta.icon}
             </Typography>
          </View>
          <Spacer horizontal size="md" />
          <View style={styles.textContent}>
            <Typography variant="body" weight="semibold" numberOfLines={2}>
              {transaction.description}
            </Typography>
            <Spacer size="xs" />
            <Typography variant="caption" color={theme.colors.secondaryText} numberOfLines={1}>
              {dateStr} • {categoryMeta.label}
            </Typography>
          </View>
        </View>

        <Typography 
          variant="body" 
          weight="semibold" 
          color={isIncome ? theme.colors.income : theme.colors.primaryText}
          align="right"
          style={styles.amount}
        >
          {isIncome ? '+' : '-'}{formattedAmount}
        </Typography>
      </TouchableOpacity>
    </Swipeable>
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
    minHeight: 72,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  leftContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.spacing.md,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  amount: {
    maxWidth: 128,
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
