import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../ui/Typography';
import { Spacer } from '../ui/Spacer';
import { theme } from '@/src/styles/theme';
import { Transaction } from '@/src/types';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useExpenseStore } from '@/src/store/useExpenseStore';

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
    // Portfólio Dica: Adicionar uma pequena confirmação mostra cuidado com UX
    Alert.alert('Apagar transação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => removeTransaction(transaction.id) },
    ]);
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
      renderRightActions={renderRightActions}
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
    backgroundColor: '#FF3B30', // Red background showing up when swiping
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    // Add a very subtle shadow/border to float above the swipe background
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    paddingRight: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  }
});
