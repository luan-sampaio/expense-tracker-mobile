import { AppDialog } from '@/src/components/ui/AppDialog';
import { Button } from '@/src/components/ui/Button';
import { CategoryIcon } from '@/src/components/ui/CategoryIcon';
import { Container } from '@/src/components/ui/Container';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { getPendingTransactionId } from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { PendingMutation, Transaction } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { successFeedback, warningFeedback } from '@/src/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

function getSyncLabel(transaction: Transaction, pendingMutations: PendingMutation[]) {
  const pending = pendingMutations.find((mutation) => {
    return getPendingTransactionId(mutation) === transaction.id;
  });

  if (!pending) {
    return {
      label: 'Sincronizada',
      description: 'Salva no servidor.',
      color: theme.colors.success,
      backgroundColor: theme.colors.incomeBackground,
      iconName: 'cloud-done' as const,
    };
  }

  if (pending.type === 'delete') {
    return {
      label: 'Remoção pendente',
      description: 'Será removida quando a conexão voltar.',
      color: theme.colors.expense,
      backgroundColor: theme.colors.expenseBackground,
      iconName: 'cloud-off' as const,
    };
  }

  return {
    label: pending.type === 'create' ? 'Criação pendente' : 'Edição pendente',
    description: 'Sincronização automática pendente.',
    color: theme.colors.warning,
    backgroundColor: theme.colors.accentBackground,
    iconName: 'sync' as const,
  };
}

function DetailRow({
  label,
  value,
  valueColor = theme.colors.primaryText,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Typography variant="caption" color={theme.colors.secondaryText}>
        {label}
      </Typography>
      <Typography
        variant="body"
        weight="semibold"
        color={valueColor}
        align="right"
        style={styles.detailValue}
        numberOfLines={3}
      >
        {value}
      </Typography>
    </View>
  );
}

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeletedDialogVisible, setIsDeletedDialogVisible] = useState(false);
  const { transactions, pendingMutations, removeTransaction } = useExpenseStore(
    useShallow((state) => ({
      transactions: state.transactions,
      pendingMutations: state.pendingMutations,
      removeTransaction: state.removeTransaction,
    }))
  );
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return (
      <Container padding="lg">
        <Stack.Screen options={{ title: 'Transação' }} />
        <Spacer size="xxl" />
        <View style={styles.emptyState}>
          <Typography variant="title" weight="bold" align="center">
            Transação não encontrada
          </Typography>
          <Spacer size="sm" />
          <Typography variant="body" color={theme.colors.secondaryText} align="center">
            Ela pode ter sido removida ou ainda estar sincronizando.
          </Typography>
          <Spacer size="lg" />
          <Button label="Voltar" onPress={() => router.back()} />
        </View>
        <AppDialog
          visible={isDeletedDialogVisible}
          variant="success"
          title="Transação apagada"
          message="A exclusão foi registrada com sucesso."
          confirmLabel="OK"
          onConfirm={() => {
            setIsDeletedDialogVisible(false);
            router.back();
          }}
        />
      </Container>
    );
  }

  const isIncome = transaction.type === 'income';
  const categoryMeta = getCategoryMeta(transaction.category);
  const syncStatus = getSyncLabel(transaction, pendingMutations);

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
      },
    });
  };

  const handleDelete = () => {
    setIsDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    warningFeedback();
    removeTransaction(transaction.id);
    setIsDeleteDialogVisible(false);
    successFeedback();
    setIsDeletedDialogVisible(true);
  };

  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
      <Stack.Screen options={{ title: 'Detalhes' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <CategoryIcon category={categoryMeta} size="lg" />
            <View style={[styles.typeBadge, {
              backgroundColor: isIncome ? theme.colors.incomeBackground : theme.colors.expenseBackground,
            }]}>
              <Typography
                variant="caption"
                weight="semibold"
                color={isIncome ? theme.colors.income : theme.colors.expense}
              >
                {isIncome ? 'Receita' : 'Despesa'}
              </Typography>
            </View>
          </View>
          <Spacer size="lg" />
          <Typography
            variant="hero"
            weight="bold"
            color={isIncome ? theme.colors.income : theme.colors.expense}
            align="center"
            numberOfLines={1}
            style={styles.amount}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Typography>
          <Spacer size="sm" />
          <Typography variant="title" weight="bold" align="center" numberOfLines={3}>
            {transaction.description}
          </Typography>
          <Spacer size="xs" />
          <Typography variant="body" color={categoryMeta.color} weight="semibold" align="center">
            {categoryMeta.label}
          </Typography>
        </View>

        <Spacer size="lg" />

        <View style={[styles.syncPill, { backgroundColor: syncStatus.backgroundColor }]}>
          <MaterialIcons name={syncStatus.iconName} size={18} color={syncStatus.color} />
          <View style={styles.syncText}>
            <Typography variant="caption" weight="semibold" color={syncStatus.color}>
              {syncStatus.label}
            </Typography>
            <Typography variant="caption" color={theme.colors.secondaryText} numberOfLines={1}>
              {syncStatus.description}
            </Typography>
          </View>
        </View>

        <Spacer size="lg" />

        <View style={styles.section}>
          <DetailRow
            label="Tipo"
            value={isIncome ? 'Receita' : 'Despesa'}
            valueColor={isIncome ? theme.colors.income : theme.colors.expense}
          />
          <DetailRow label="Categoria" value={categoryMeta.label} valueColor={categoryMeta.color} />
          <DetailRow label="Data" value={formatDate(transaction.date)} />
          <DetailRow label="Descrição" value={transaction.description} />
        </View>

        <Spacer size="xl" />

        <View style={styles.actions}>
          <Button label="Editar" onPress={handleEdit} style={styles.primaryAction} />
          <Button
            label="Apagar"
            variant="ghost"
            onPress={handleDelete}
            style={styles.deleteButton}
            accessibilityLabel="Apagar transação"
          />
        </View>
      </ScrollView>

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

      <AppDialog
        visible={isDeletedDialogVisible}
        variant="success"
        title="Transação apagada"
        message="A exclusão foi registrada com sucesso."
        confirmLabel="OK"
        onConfirm={() => {
          setIsDeletedDialogVisible(false);
          router.back();
        }}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeBadge: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
  },
  amount: {
    width: '100%',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.lg,
  },
  detailValue: {
    flex: 1,
    minWidth: 160,
  },
  syncPill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  syncText: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  primaryAction: {
    flex: 1,
    minWidth: 144,
  },
  deleteButton: {
    flex: 1,
    minWidth: 144,
    backgroundColor: theme.colors.expenseBackground,
    borderWidth: 1,
    borderColor: theme.colors.expenseBorder,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
});
