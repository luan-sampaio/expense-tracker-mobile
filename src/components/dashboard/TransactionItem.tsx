import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { Transaction } from '@/src/types';
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

  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(transaction.amount);

  const dateStr = new Date(transaction.date).toLocaleDateString('pt-BR');

  const handleDelete = () => {
    Alert.alert('Apagar transação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => removeTransaction(transaction.id) },
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
      }
    });
  };

  const renderLeftActions = () => {
    return (
      <TouchableOpacity 
        style={styles.editAction} 
        onPress={handleEdit}
        activeOpacity={0.8}
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
      <View style={styles.container}>
        <View style={styles.leftContent}>
          <View style={[
            styles.iconPlaceholder, 
            { backgroundColor: isIncome ? theme.colors.incomeBackground : theme.colors.expenseBackground }
          ]}>
             <Typography variant="title" weight="bold" color={isIncome ? theme.colors.income : theme.colors.expense}>
                {transaction.category.substring(0, 1).toUpperCase()}
             </Typography>
          </View>
          <Spacer horizontal size="md" />
          <View>
            <Typography variant="body" weight="semibold">
              {transaction.description}
            </Typography>
            <Spacer size="xs" />
            <Typography variant="caption" color={theme.colors.secondaryText}>
              {dateStr} • {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
            </Typography>
          </View>
        </View>

        <Typography 
          variant="body" 
          weight="semibold" 
          color={isIncome ? theme.colors.income : theme.colors.primaryText}
        >
          {isIncome ? '+' : '-'}{formattedAmount}
        </Typography>
      </View>
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
