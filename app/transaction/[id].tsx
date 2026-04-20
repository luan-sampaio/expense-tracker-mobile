import { Button } from '@/src/components/ui/Button';
import { Container } from '@/src/components/ui/Container';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { PendingMutation, Transaction } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { warningFeedback } from '@/src/utils/haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

function getPendingTransactionId(mutation: PendingMutation) {
  return mutation.type === 'delete'
    ? mutation.transactionId
    : mutation.transaction.id;
}

function getSyncLabel(transaction: Transaction, pendingMutations: PendingMutation[]) {
  const pending = pendingMutations.find((mutation) => {
    return getPendingTransactionId(mutation) === transaction.id;
  });

  if (!pending) {
    return {
      label: 'Sincronizada',
      description: 'Esta transação já está salva no servidor.',
      color: theme.colors.success,
      backgroundColor: theme.colors.incomeBackground,
    };
  }

  if (pending.type === 'delete') {
    return {
      label: 'Remoção pendente',
      description: 'A exclusão será enviada quando a conexão voltar.',
      color: theme.colors.expense,
      backgroundColor: theme.colors.expenseBackground,
    };
  }

  return {
    label: pending.type === 'create' ? 'Criação pendente' : 'Edição pendente',
    description: 'A alteração será sincronizada automaticamente.',
    color: theme.colors.warning,
    backgroundColor: theme.colors.accentBackground,
  };
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Typography variant="caption" color={theme.colors.secondaryText}>
        {label}
      </Typography>
      <Typography variant="body" weight="semibold">
        {value}
      </Typography>
    </View>
  );
}

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactions = useExpenseStore((state) => state.transactions);
  const pendingMutations = useExpenseStore((state) => state.pendingMutations);
  const removeTransaction = useExpenseStore((state) => state.removeTransaction);
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
    Alert.alert('Apagar transação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          warningFeedback();
          removeTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
      <Stack.Screen options={{ title: 'Detalhes' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: categoryMeta.backgroundColor },
            ]}
          >
            <Typography variant="heading" color={categoryMeta.color}>
              {categoryMeta.icon}
            </Typography>
          </View>
          <Spacer size="md" />
          <Typography variant="title" weight="bold" align="center" numberOfLines={3}>
            {transaction.description}
          </Typography>
          <Spacer size="xs" />
          <Typography
            variant="heading"
            weight="bold"
            color={isIncome ? theme.colors.income : theme.colors.expense}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Typography>
        </View>

        <Spacer size="lg" />

        <View style={styles.section}>
          <DetailRow label="Tipo" value={isIncome ? 'Receita' : 'Despesa'} />
          <DetailRow label="Categoria" value={categoryMeta.label} />
          <DetailRow label="Data" value={formatDate(transaction.date)} />
          <DetailRow label="Identificador" value={transaction.id} />
        </View>

        <Spacer size="lg" />

        <View style={[styles.syncBox, { backgroundColor: syncStatus.backgroundColor }]}>
          <Typography variant="body" weight="semibold" color={syncStatus.color}>
            {syncStatus.label}
          </Typography>
          <Spacer size="xs" />
          <Typography variant="caption" color={theme.colors.secondaryText}>
            {syncStatus.description}
          </Typography>
        </View>

        <Spacer size="xl" />

        <View style={styles.actions}>
          <Button label="Editar" onPress={handleEdit} style={styles.actionButton} />
          <Button
            label="Apagar"
            variant="danger"
            onPress={handleDelete}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  detailRow: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.xs,
  },
  syncBox: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 132,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
});
