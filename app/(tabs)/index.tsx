import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { BudgetRuleWidget } from '@/src/components/dashboard/BudgetRuleWidget';
import { TransactionItem } from '@/src/components/dashboard/TransactionItem';
import { Button } from '@/src/components/ui/Button';
import { Container } from '@/src/components/ui/Container';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const transactions = useExpenseStore((state) => state.transactions);
  const isLoading = useExpenseStore((state) => state.isLoading);
  const error = useExpenseStore((state) => state.error);
  const pendingMutations = useExpenseStore((state) => state.pendingMutations);
  const syncAll = useExpenseStore((state) => state.syncAll);
  const pendingCount = pendingMutations.length;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Spacer size="xxl" />

          {error && (
            <Container padding="lg" flex={0}>
              <View style={styles.errorCard}>
                <Typography variant="body" color={theme.colors.expense} align="center">
                  {error}
                </Typography>
              </View>
              <Spacer size="md" />
            </Container>
          )}

          {pendingCount > 0 && (
            <Container padding="lg" flex={0}>
              <View style={styles.pendingCard}>
                <View style={styles.pendingText}>
                  <Typography variant="body" weight="semibold" color={theme.colors.warning}>
                    {pendingCount === 1
                      ? '1 alteração aguardando sincronização'
                      : `${pendingCount} alterações aguardando sincronização`}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.secondaryText}>
                    O app tentará enviar automaticamente quando o servidor responder.
                  </Typography>
                </View>
                <Button
                  label="Tentar agora"
                  variant="secondary"
                  onPress={() => syncAll()}
                  style={styles.retryButton}
                />
              </View>
              <Spacer size="md" />
            </Container>
          )}

          <BalanceHeader />
          
          <Container padding="lg" flex={0}>
            <Button label="+ Nova Transação" onPress={() => router.push('/modal')} />
            <Spacer size="xl" />
            <BudgetRuleWidget />
          </Container>
          
          <Container padding="lg" flex={0}>
            <Typography variant="title" weight="semibold">
            Transações Recentes
          </Typography>
          <Spacer size="lg" />
          
          {isLoading ? (
            <LoadingSpinner message="Sincronizando..." />
          ) : sortedTransactions.length === 0 ? (
            <Container padding="lg" backgroundColor={theme.colors.surface} style={styles.emptyCard}>
              <Typography variant="body" color={theme.colors.secondaryText} align="center">
                Você ainda não tem gastos ou receitas cadastrados.
              </Typography>
            </Container>
          ) : (
            <View>
              {sortedTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}
        </Container>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  emptyCard: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    ...theme.shadows.sm,
  },
  errorCard: {
    backgroundColor: theme.colors.expenseBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.expenseBorder,
  },
  pendingCard: {
    backgroundColor: theme.colors.accentBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    gap: theme.spacing.md,
  },
  pendingText: {
    gap: theme.spacing.xs,
  },
  retryButton: {
    height: 44,
    alignSelf: 'flex-start',
  },
});
