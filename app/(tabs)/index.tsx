import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { BudgetRuleWidget } from '@/src/components/dashboard/BudgetRuleWidget';
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
      variant: 'info',
      iconName: 'sync',
    },
    offline: {
      label: 'Offline',
      variant: 'danger',
      iconName: 'cloud-off',
    },
    syncing: {
      label: 'Sincronizando',
      variant: 'warning',
      iconName: 'sync',
    },
    synced: {
      label: 'Tudo salvo',
      variant: 'success',
      iconName: 'cloud-done',
    },
  } as const;
  const currentStatusConfig = statusConfig[syncStatus];
  const shouldShowCompactSync = syncStatus === 'synced' && pendingCount === 0 && !error;
  const shouldHideSyncCard = syncStatus === 'offline' && pendingCount === 0 && Boolean(error);

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
    setIsFiltersExpanded(false);
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

      {shouldShowCompactSync ? (
        <View style={styles.section}>
          <View style={styles.compactSync}>
            <MaterialIcons name="cloud-done" size={18} color={theme.colors.success} />
            <Typography variant="caption" weight="semibold" color={theme.colors.success}>
              Tudo salvo
            </Typography>
          </View>
        </View>
      ) : !shouldHideSyncCard ? (
        <View style={styles.section}>
          <InfoBanner
            title={currentStatusConfig.label}
            message={[
              formatLastSyncAt(lastSyncAt),
              pendingCount === 1
                ? '1 alteração pendente'
                : pendingCount > 1
                  ? `${pendingCount} alterações pendentes`
                  : '',
            ].filter(Boolean).join(' • ')}
            variant={currentStatusConfig.variant}
            iconName={currentStatusConfig.iconName}
            isLoading={syncStatus === 'syncing'}
            actionLabel={pendingCount > 0 ? 'Tentar agora' : undefined}
            onAction={pendingCount > 0 ? () => {
              impactFeedback();
              syncAll();
            } : undefined}
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
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.colors.secondaryText} />
              <Input
                placeholder="Buscar descrição"
                accessibilityLabel="Buscar transações por descrição"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
              />
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
                onSelectPeriod={setSelectedPeriod}
              />

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
            : 'Adicione uma receita ou despesa para acompanhar seu saldo e seus gastos.'
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
  transactionsBand: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
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
    flex: 1,
    minHeight: 44,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  filterToggle: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  filterToggleActive: {
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
