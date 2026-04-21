import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { BudgetRuleWidget } from '@/src/components/dashboard/BudgetRuleWidget';
import { TransactionItem } from '@/src/components/dashboard/TransactionItem';
import { AppDialog } from '@/src/components/ui/AppDialog';
import { Button } from '@/src/components/ui/Button';
import { Container } from '@/src/components/ui/Container';
import { Input } from '@/src/components/ui/Input';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Period, PeriodFilter } from '@/src/components/ui/PeriodFilter';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoryMeta } from '@/src/constants/categories';
import {
  filterTransactions,
  getTransactionCategoryIds,
} from '@/src/domain/transactions';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { Transaction, TransactionType } from '@/src/types';
import { impactFeedback, successFeedback } from '@/src/utils/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

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

export default function HomeScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletedDialogVisible, setIsDeletedDialogVisible] = useState(false);
  const {
    transactions,
    isLoading,
    error,
    pendingMutations,
    syncStatus,
    lastSyncAt,
    syncAll,
  } = useExpenseStore(
    useShallow((state) => ({
      transactions: state.transactions,
      isLoading: state.isLoading,
      error: state.error,
      pendingMutations: state.pendingMutations,
      syncStatus: state.syncStatus,
      lastSyncAt: state.lastSyncAt,
      syncAll: state.syncAll,
    }))
  );
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
  const shouldShowCompactSync = syncStatus === 'synced' && pendingCount === 0 && !error;

  const categoryFilters = useMemo(() => {
    return getTransactionCategoryIds(transactions);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      period: selectedPeriod,
      type: selectedType,
      category: selectedCategory,
      search: searchQuery,
    });
  }, [transactions, searchQuery, selectedCategory, selectedPeriod, selectedType]);

  const activeFilterCount = [
    selectedPeriod !== 'all',
    selectedType !== 'all',
    selectedCategory !== 'all',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    impactFeedback();
    setSelectedPeriod('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSearchQuery('');
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
          <View style={styles.errorCard}>
            <Typography variant="body" color={theme.colors.expense} align="center">
              {error}
            </Typography>
          </View>
          <Spacer size="md" />
        </View>
      )}

      {shouldShowCompactSync ? (
        <View style={styles.section}>
          <View style={styles.compactSync}>
            <MaterialIcons name="cloud-done" size={18} color={theme.colors.success} />
            <Typography variant="caption" weight="semibold" color={theme.colors.success}>
              Tudo salvo
            </Typography>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
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
              <View style={styles.syncTitle}>
                <MaterialIcons
                  name={syncStatus === 'offline' ? 'cloud-off' : 'sync'}
                  size={20}
                  color={statusConfig.color}
                />
                <Typography variant="body" weight="semibold" color={statusConfig.color}>
                  {statusConfig.label}
                </Typography>
              </View>
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
                    onPress={() => {
                      impactFeedback();
                      syncAll();
                    }}
                    style={styles.retryButton}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}

      <BalanceHeader />

      <View style={styles.section}>
        <Button label="+ Nova Transação" onPress={() => router.push('/modal')} />
        <Spacer size="lg" />
        <BudgetRuleWidget />
      </View>

      <View style={styles.transactionsBand}>
        <View style={styles.section}>
          <View style={styles.transactionsHeader}>
            <View style={styles.transactionsTitle}>
              <Typography variant="title" weight="semibold">
                Transações Recentes
              </Typography>
              {hasActiveFilters && (
                <Typography variant="caption" color={theme.colors.secondaryText}>
                  {activeFilterCount === 1
                    ? '1 filtro ativo'
                    : `${activeFilterCount} filtros ativos`}
                </Typography>
              )}
            </View>

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearFiltersPill}
                onPress={clearFilters}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={
                  activeFilterCount === 1
                    ? 'Limpar 1 filtro ativo'
                    : `Limpar ${activeFilterCount} filtros ativos`
                }
              >
                <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
                  Limpar
                </Typography>
                <View style={styles.clearFiltersBadge}>
                  <Typography variant="caption" weight="semibold" color={theme.colors.primary}>
                    {activeFilterCount}
                  </Typography>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Spacer size="md" />

            <Input
              placeholder="Buscar por descrição"
              accessibilityLabel="Buscar transações por descrição"
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
                    onPress={() => {
                      impactFeedback();
                      setSelectedType(filter.id);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar por ${filter.label.toLowerCase()}`}
                    accessibilityState={{ selected: isSelected }}
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
                onPress={() => {
                  impactFeedback();
                  setSelectedCategory('all');
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Mostrar todas as categorias"
                accessibilityState={{ selected: selectedCategory === 'all' }}
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
                    onPress={() => {
                      impactFeedback();
                      setSelectedCategory(category);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar categoria ${getCategoryMeta(category).label}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Typography
                      variant="caption"
                      weight={isSelected ? 'semibold' : 'regular'}
                      color={isSelected ? theme.colors.primary : theme.colors.secondaryText}
                    >
                      {getCategoryMeta(category).label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Spacer size="lg" />
        </View>
      </View>
    </>
  );

  const listEmpty = isLoading ? (
    <View style={styles.section}>
      <LoadingSpinner message="Sincronizando..." />
    </View>
  ) : (
    <View style={[styles.section, styles.emptyCard]}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons
          name={hasActiveFilters ? 'search-off' : 'account-balance-wallet'}
          size={34}
          color={theme.colors.primary}
        />
      </View>
      <Spacer size="sm" />
      <Typography variant="body" weight="semibold" color={theme.colors.primaryText} align="center">
        {hasActiveFilters ? 'Nada encontrado' : 'Comece pelo primeiro lançamento'}
      </Typography>
      <Spacer size="xs" />
      <Typography variant="body" color={theme.colors.secondaryText} align="center">
        {hasActiveFilters
          ? 'Tente ajustar a busca, período, tipo ou categoria para encontrar uma transação.'
          : 'Adicione uma receita ou despesa para acompanhar seu saldo e seus gastos.'}
      </Typography>
      <Spacer size="lg" />
      <Button
        label={hasActiveFilters ? 'Limpar filtros' : 'Adicionar primeira transação'}
        variant={hasActiveFilters ? 'secondary' : 'primary'}
        onPress={hasActiveFilters ? clearFilters : () => router.push('/modal')}
        style={styles.emptyButton}
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
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
    ...theme.shadows.sm,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryBackground,
  },
  emptyButton: {
    alignSelf: 'stretch',
  },
  errorCard: {
    backgroundColor: theme.colors.expenseBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.expenseBorder,
  },
  syncCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  compactSync: {
    alignSelf: 'flex-end',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.incomeBackground,
  },
  syncHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  syncTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  syncActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'stretch',
    paddingHorizontal: theme.spacing.lg,
  },
  transactionsHeader: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  transactionsTitle: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  transactionsBand: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
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
  clearFiltersPill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground,
  },
  clearFiltersBadge: {
    minWidth: 22,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
});
