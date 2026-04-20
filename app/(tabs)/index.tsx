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

function formatLastSyncAt(lastSyncAt: string | null) {
  if (!lastSyncAt) return 'Ainda não sincronizado';

  return `Última sincronização: ${new Date(lastSyncAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function HomeScreen() {
  const transactions = useExpenseStore((state) => state.transactions);
  const isLoading = useExpenseStore((state) => state.isLoading);
  const error = useExpenseStore((state) => state.error);
  const pendingMutations = useExpenseStore((state) => state.pendingMutations);
  const syncStatus = useExpenseStore((state) => state.syncStatus);
  const lastSyncAt = useExpenseStore((state) => state.lastSyncAt);
  const syncAll = useExpenseStore((state) => state.syncAll);
  const pendingCount = pendingMutations.length;
  const statusConfig = {
    online: {
      label: 'Online',
      color: theme.colors.info,
      background: theme.colors.infoBackground,
      border: theme.colors.info,
    },
    offline: {
      label: 'Offline',
      color: theme.colors.expense,
      background: theme.colors.expenseBackground,
      border: theme.colors.expenseBorder,
    },
    syncing: {
      label: 'Sincronizando',
      color: theme.colors.warning,
      background: theme.colors.accentBackground,
      border: theme.colors.accent,
    },
    synced: {
      label: 'Tudo salvo',
      color: theme.colors.success,
      background: theme.colors.incomeBackground,
      border: theme.colors.incomeBorder,
    },
  }[syncStatus];

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

          <Container padding="lg" flex={0}>
            <View
              style={[
                styles.syncCard,
                {
                  backgroundColor: statusConfig.background,
                  borderColor: statusConfig.border,
                },
              ]}
            >
              <View style={styles.syncHeader}>
                <Typography variant="body" weight="semibold" color={statusConfig.color}>
                  {statusConfig.label}
                </Typography>
                {pendingCount > 0 && (
                  <Typography variant="caption" color={theme.colors.secondaryText}>
                    {pendingCount === 1
                      ? '1 alteração pendente'
                      : `${pendingCount} alterações pendentes`}
                  </Typography>
                )}
              </View>

              <Typography variant="caption" color={theme.colors.secondaryText}>
                {formatLastSyncAt(lastSyncAt)}
              </Typography>

              {pendingCount > 0 && (
                <>
                  <Typography variant="caption" color={theme.colors.secondaryText}>
                    {pendingCount === 1
                      ? 'A alteração será reenviada automaticamente quando o servidor responder.'
                      : `${pendingCount} alterações aguardando sincronização`}
                  </Typography>

                  <View style={styles.syncActions}>
                    <Button
                      label="Tentar agora"
                      variant="secondary"
                      onPress={() => syncAll()}
                      style={styles.retryButton}
                    />
                  </View>
                </>
              )}
            </View>
            <Spacer size="md" />
          </Container>

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
  syncCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  syncActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  retryButton: {
    height: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
});
