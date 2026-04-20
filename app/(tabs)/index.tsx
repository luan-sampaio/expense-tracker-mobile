import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { BudgetRuleWidget } from '@/src/components/dashboard/BudgetRuleWidget';
import { TransactionItem } from '@/src/components/dashboard/TransactionItem';
import { Button } from '@/src/components/ui/Button';
import { Container } from '@/src/components/ui/Container';
import { Input } from '@/src/components/ui/Input';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Period, PeriodFilter } from '@/src/components/ui/PeriodFilter';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { TransactionType } from '@/src/types';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type TypeFilter = 'all' | TransactionType;
type CategoryFilter = 'all' | string;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Receitas' },
  { id: 'expense', label: 'Despesas' },
];

function formatLastSyncAt(lastSyncAt: string | null) {
  if (!lastSyncAt) return 'Ainda não sincronizado';

  return `Última sincronização: ${new Date(lastSyncAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function isWithinPeriod(date: string, period: Period) {
  if (period === 'all') return true;

  const transactionDate = new Date(date);
  const today = new Date();

  if (period === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return transactionDate >= weekAgo;
  }

  if (period === 'month') {
    return (
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getFullYear() === today.getFullYear()
    );
  }

  return transactionDate.getFullYear() === today.getFullYear();
}

function formatCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function HomeScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const categoryFilters = useMemo(() => {
    const categories = Array.from(new Set(transactions.map((item) => item.category)));
    return categories.sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return transactions
      .filter((transaction) => isWithinPeriod(transaction.date, selectedPeriod))
      .filter((transaction) => selectedType === 'all' || transaction.type === selectedType)
      .filter((transaction) => selectedCategory === 'all' || transaction.category === selectedCategory)
      .filter((transaction) => {
        if (!normalizedQuery) return true;

        return transaction.description.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, selectedCategory, selectedPeriod, selectedType]);

  const hasActiveFilters =
    selectedPeriod !== 'all' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedPeriod('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

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

            <Input
              placeholder="Buscar por descrição"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <Spacer size="md" />

            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
            />
            <Spacer size="md" />

            <View style={styles.filterGroup}>
              {TYPE_FILTERS.map((filter) => {
                const isSelected = selectedType === filter.id;

                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    onPress={() => setSelectedType(filter.id)}
                    activeOpacity={0.7}
                  >
                    <Typography
                      variant="caption"
                      weight={isSelected ? 'semibold' : 'regular'}
                      color={isSelected ? theme.colors.primary : theme.colors.secondaryText}
                    >
                      {filter.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Spacer size="sm" />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === 'all' && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.7}
              >
                <Typography
                  variant="caption"
                  weight={selectedCategory === 'all' ? 'semibold' : 'regular'}
                  color={selectedCategory === 'all' ? theme.colors.primary : theme.colors.secondaryText}
                >
                  Todas categorias
                </Typography>
              </TouchableOpacity>

              {categoryFilters.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Typography
                      variant="caption"
                      weight={isSelected ? 'semibold' : 'regular'}
                      color={isSelected ? theme.colors.primary : theme.colors.secondaryText}
                    >
                      {formatCategoryLabel(category)}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {hasActiveFilters && (
              <>
                <Spacer size="sm" />
                <Button
                  label="Limpar filtros"
                  variant="ghost"
                  onPress={clearFilters}
                  style={styles.clearFiltersButton}
                />
              </>
            )}
            <Spacer size="lg" />
          
          {isLoading ? (
            <LoadingSpinner message="Sincronizando..." />
          ) : filteredTransactions.length === 0 ? (
            <Container padding="lg" backgroundColor={theme.colors.surface} style={styles.emptyCard}>
              <Typography variant="body" color={theme.colors.secondaryText} align="center">
                {hasActiveFilters
                  ? 'Nenhuma transação encontrada com os filtros atuais.'
                  : 'Você ainda não tem gastos ou receitas cadastrados.'}
              </Typography>
            </Container>
          ) : (
            <View>
              {filteredTransactions.map((transaction) => (
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
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryFilterContent: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  filterChip: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  filterChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground,
  },
  clearFiltersButton: {
    height: 40,
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
});
