import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { BudgetRuleWidget } from '@/src/components/dashboard/BudgetRuleWidget';
import { FinancialGoalsWidget } from '@/src/components/dashboard/FinancialGoalsWidget';
import { TransactionItem } from '@/src/components/dashboard/TransactionItem';
import { AppDialog } from '@/src/components/ui/AppDialog';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { Container } from '@/src/components/ui/Container';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { InfoBanner } from '@/src/components/ui/InfoBanner';
import { Input } from '@/src/components/ui/Input';
import { Period, PeriodFilter } from '@/src/components/ui/PeriodFilter';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import {
  filterTransactions,
  getTransactionCategoryIds,
  TransactionTypeFilter,
} from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { Transaction } from '@/src/types';
import { formatMonthLabel } from '@/src/utils/formatters';
import { impactFeedback, successFeedback } from '@/src/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

type TypeFilter = TransactionTypeFilter;
type CategoryFilter = 'all' | string;
type DateScopeFilter = 'all' | `year:${number}` | `month:${string}`;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Receitas' },
  { id: 'contribution', label: 'Aportes' },
  { id: 'expense', label: 'Despesas' },
];

function getMonthKey(value: string | Date) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${date.getFullYear()}-${month}`;
}

function getDateScopeLabel(scope: DateScopeFilter) {
  if (scope === 'all') return 'Todos meses';

  if (scope.startsWith('year:')) {
    return scope.replace('year:', '');
  }

  const [, monthKey] = scope.split(':');
  const [year, month] = monthKey.split('-').map(Number);

  return formatMonthLabel(new Date(year, month - 1, 1));
}

function isTransactionInDateScope(transaction: Transaction, scope: DateScopeFilter) {
  if (scope === 'all') return true;

  const transactionDate = new Date(transaction.date);

  if (scope.startsWith('year:')) {
    return transactionDate.getFullYear() === Number(scope.replace('year:', ''));
  }

  return getMonthKey(transaction.date) === scope.replace('month:', '');
}

function TransactionSkeletonList() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonText}>
            <View style={styles.skeletonLineLarge} />
            <View style={styles.skeletonLineSmall} />
            <View style={styles.skeletonLineTiny} />
          </View>
          <View style={styles.skeletonAmount} />
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [selectedDateScope, setSelectedDateScope] = useState<DateScopeFilter>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isDeletedDialogVisible, setIsDeletedDialogVisible] = useState(false);
  const {
    transactions,
    isLoading,
    error,
    pendingMutations,
    syncAll,
  } = useExpenseStore(
    useShallow((state) => ({
      transactions: state.transactions,
      isLoading: state.isLoading,
      error: state.error,
      pendingMutations: state.pendingMutations,
      syncAll: state.syncAll,
    }))
  );
  const pendingCount = pendingMutations.length;
  const shouldShowPendingSyncBanner = pendingCount > 0 && !error;

  const categoryFilters = useMemo(() => {
    return getTransactionCategoryIds(transactions);
  }, [transactions]);

  const dateScopeFilters = useMemo(() => {
    const yearScopes = Array.from(new Set(
      transactions.map((transaction) => new Date(transaction.date).getFullYear())
    ))
      .sort((a, b) => b - a)
      .map((year) => `year:${year}` as const);

    const monthScopes = Array.from(new Set(
      transactions.map((transaction) => getMonthKey(transaction.date))
    ))
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => `month:${monthKey}` as const);

    return {
      years: yearScopes,
      months: monthScopes,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const dateScopedTransactions = transactions.filter((transaction) => {
      return isTransactionInDateScope(transaction, selectedDateScope);
    });

    return filterTransactions(dateScopedTransactions, {
      period: selectedPeriod,
      type: selectedType,
      category: selectedCategory,
      search: searchQuery,
    });
  }, [transactions, searchQuery, selectedCategory, selectedDateScope, selectedPeriod, selectedType]);

  const activeFilterCount = [
    selectedPeriod !== 'all',
    selectedDateScope !== 'all',
    selectedType !== 'all',
    selectedCategory !== 'all',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    impactFeedback();
    setSelectedPeriod('all');
    setSelectedDateScope('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setIsFiltersExpanded(false);
  };

  const handlePeriodSelect = (period: Period) => {
    setSelectedPeriod(period);
    setSelectedDateScope('all');
  };

  const handleDateScopeSelect = (scope: DateScopeFilter) => {
    impactFeedback();
    setSelectedDateScope(scope);
    setSelectedPeriod('all');
  };

  const renderTransaction: ListRenderItem<Transaction> = ({ item }) => (
    <View style={styles.section}>
      <TransactionItem
        transaction={item}
        onDeleted={() => {
          successFeedback();
          setIsDeletedDialogVisible(true);
        }}
      />
    </View>
  );

  const listHeader = (
    <>
      <Spacer size="xl" />

      {error && (
        <View style={styles.section}>
          <InfoBanner
            title="Não foi possível sincronizar"
            message={error}
            variant="danger"
            iconName="wifi-off"
            actionLabel="Tentar novamente"
            onAction={() => {
              impactFeedback();
              syncAll();
            }}
          />
          <Spacer size="md" />
        </View>
      )}

      {shouldShowPendingSyncBanner ? (
        <View style={styles.section}>
          <InfoBanner
            title="Alterações pendentes"
            message={
              pendingCount === 1
                ? '1 alteração aguardando sincronização.'
                : `${pendingCount} alterações aguardando sincronização.`
            }
            variant="warning"
            iconName="schedule"
            actionLabel="Tentar agora"
            onAction={() => {
              impactFeedback();
              syncAll();
            }}
          />
        </View>
      ) : null}

      <BalanceHeader />

      <View style={styles.section}>
        <Button
          label="Nova Transação"
          iconName="add"
          onPress={() => router.push('/modal')}
        />
        <Spacer size="lg" />
        <BudgetRuleWidget />
        <Spacer size="lg" />
        <FinancialGoalsWidget />
      </View>

      <View style={styles.transactionsBand}>
        <View style={styles.section}>
          <SectionHeader
            title="Transações Recentes"
            subtitle={
              hasActiveFilters
                ? activeFilterCount === 1
                  ? '1 filtro ativo'
                  : `${activeFilterCount} filtros ativos`
                : undefined
            }
            action={hasActiveFilters ? (
              <Button
                label="Limpar"
                variant="ghost"
                size="sm"
                iconName="close"
                onPress={clearFilters}
                accessibilityLabel={
                  activeFilterCount === 1
                    ? 'Limpar 1 filtro ativo'
                    : `Limpar ${activeFilterCount} filtros ativos`
                }
              />
            ) : undefined}
          />
          <Spacer size="sm" />

          <View style={styles.filterToolbar}>
            <View style={styles.searchGroup}>
              <Typography variant="body" weight="semibold">
                Buscar
              </Typography>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color={theme.colors.secondaryText} />
                <Input
                  placeholder="Descrição da transação"
                  accessibilityLabel="Buscar transações por descrição"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  containerStyle={styles.searchInputContainer}
                  style={styles.searchInput}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.filterToggle,
                (isFiltersExpanded || activeFilterCount > 0) && styles.filterToggleActive,
              ]}
              onPress={() => {
                impactFeedback();
                setIsFiltersExpanded((current) => !current);
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isFiltersExpanded ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
            >
              <MaterialIcons
                name="tune"
                size={20}
                color={(isFiltersExpanded || activeFilterCount > 0) ? theme.colors.primary : theme.colors.secondaryText}
              />
              {activeFilterCount > 0 && (
                <Badge label={activeFilterCount} variant="primary" size="sm" style={styles.filterCountBadge} />
              )}
            </TouchableOpacity>
          </View>

          {isFiltersExpanded && (
            <View style={styles.advancedFilters}>
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handlePeriodSelect}
              />

              {(dateScopeFilters.years.length > 0 || dateScopeFilters.months.length > 0) && (
                <View style={styles.filterGroupStack}>
                  <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
                    Arquivo
                  </Typography>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateScopeFilterContent}
                  >
                    <Chip
                      label="Todos meses"
                      selected={selectedDateScope === 'all'}
                      onPress={() => handleDateScopeSelect('all')}
                      accessibilityLabel="Mostrar transações de todos os meses"
                    />

                    {dateScopeFilters.years.map((scope) => {
                      const isSelected = selectedDateScope === scope;

                      return (
                        <Chip
                          key={scope}
                          label={getDateScopeLabel(scope)}
                          selected={isSelected}
                          onPress={() => handleDateScopeSelect(scope)}
                          accessibilityLabel={`Filtrar transações de ${getDateScopeLabel(scope)}`}
                        />
                      );
                    })}

                    {dateScopeFilters.months.map((scope) => {
                      const isSelected = selectedDateScope === scope;

                      return (
                        <Chip
                          key={scope}
                          label={getDateScopeLabel(scope)}
                          selected={isSelected}
                          onPress={() => handleDateScopeSelect(scope)}
                          accessibilityLabel={`Filtrar transações de ${getDateScopeLabel(scope)}`}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.filterGroup}>
                {TYPE_FILTERS.map((filter) => {
                  const isSelected = selectedType === filter.id;

                  return (
                    <Chip
                      key={filter.id}
                      label={filter.label}
                      selected={isSelected}
                      onPress={() => {
                        setSelectedType(filter.id);
                      }}
                      accessibilityLabel={`Filtrar por ${filter.label.toLowerCase()}`}
                    />
                  );
                })}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterContent}
              >
                <Chip
                  label="Todas categorias"
                  selected={selectedCategory === 'all'}
                  onPress={() => {
                    setSelectedCategory('all');
                  }}
                  accessibilityLabel="Mostrar todas as categorias"
                />

                {categoryFilters.map((category) => {
                  const isSelected = selectedCategory === category;

                  return (
                    <Chip
                      key={category}
                      label={getCategoryMeta(category).label}
                      selected={isSelected}
                      onPress={() => {
                        setSelectedCategory(category);
                      }}
                      accessibilityLabel={`Filtrar categoria ${getCategoryMeta(category).label}`}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
          <Spacer size="md" />
        </View>
      </View>
    </>
  );

  const listEmpty = isLoading ? (
    <View style={styles.section}>
      <TransactionSkeletonList />
    </View>
  ) : (
    <View style={styles.section}>
      <EmptyState
        iconName={hasActiveFilters ? 'search-off' : 'account-balance-wallet'}
        title={hasActiveFilters ? 'Nada encontrado' : 'Comece pelo primeiro lançamento'}
        message={
          hasActiveFilters
            ? 'Tente ajustar a busca, período, tipo ou categoria para encontrar uma transação.'
            : 'Adicione uma receita, despesa ou aporte para acompanhar seu saldo e seus gastos.'
        }
        actionLabel={hasActiveFilters ? 'Limpar filtros' : 'Adicionar primeira transação'}
        actionVariant={hasActiveFilters ? 'secondary' : 'primary'}
        onAction={hasActiveFilters ? clearFilters : () => router.push('/modal')}
      />
    </View>
  );

  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
      <FlatList
        data={isLoading ? [] : filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <AppDialog
        visible={isDeletedDialogVisible}
        variant="success"
        title="Transação apagada"
        message="A exclusão foi registrada com sucesso."
        confirmLabel="OK"
        onConfirm={() => setIsDeletedDialogVisible(false)}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
  },
  transactionsBand: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  searchGroup: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  searchBox: {
    minHeight: theme.touchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  searchInput: {
    minHeight: theme.touchTarget.min,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  filterToggle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  filterToggleActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground,
  },
  filterCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  advancedFilters: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterGroupStack: {
    gap: theme.spacing.xs,
  },
  dateScopeFilterContent: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  categoryFilterContent: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  skeletonList: {
    gap: theme.spacing.sm,
  },
  skeletonCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  skeletonText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  skeletonLineLarge: {
    width: '72%',
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  skeletonLineSmall: {
    width: '48%',
    height: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  skeletonLineTiny: {
    width: '34%',
    height: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  skeletonAmount: {
    width: 76,
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSecondary,
  },
});
