import { theme } from '@/src/styles/theme';
import { TransactionType } from '@/src/types';

export type CategoryMeta = {
  id: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  type: TransactionType;
};

export const CATEGORY_OPTIONS: CategoryMeta[] = [
  {
    id: 'food',
    label: 'Alimentação',
    icon: '🍔',
    color: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
    type: 'expense',
  },
  {
    id: 'transport',
    label: 'Transporte',
    icon: '🚗',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    type: 'expense',
  },
  {
    id: 'housing',
    label: 'Moradia',
    icon: '🏠',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryBackground,
    type: 'expense',
  },
  {
    id: 'entertainment',
    label: 'Lazer',
    icon: '🎮',
    color: '#8A5FBF',
    backgroundColor: '#F2ECFA',
    type: 'expense',
  },
  {
    id: 'health',
    label: 'Saúde',
    icon: '💊',
    color: '#B84F6A',
    backgroundColor: '#FAEDF1',
    type: 'expense',
  },
  {
    id: 'education',
    label: 'Educação',
    icon: '📚',
    color: '#5B6FB8',
    backgroundColor: '#EEF1FA',
    type: 'expense',
  },
  {
    id: 'shopping',
    label: 'Compras',
    icon: '🛍️',
    color: theme.colors.accent,
    backgroundColor: theme.colors.accentBackground,
    type: 'expense',
  },
  {
    id: 'bills',
    label: 'Contas',
    icon: '📄',
    color: '#6F7A84',
    backgroundColor: '#EEF0F2',
    type: 'expense',
  },
  {
    id: 'salary',
    label: 'Salário',
    icon: '💰',
    color: theme.colors.income,
    backgroundColor: theme.colors.incomeBackground,
    type: 'income',
  },
  {
    id: 'freelance',
    label: 'Freelance',
    icon: '💼',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    type: 'income',
  },
  {
    id: 'investment',
    label: 'Investimento',
    icon: '📈',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryBackground,
    type: 'income',
  },
  {
    id: 'gift',
    label: 'Presente',
    icon: '🎁',
    color: '#8A5FBF',
    backgroundColor: '#F2ECFA',
    type: 'income',
  },
  {
    id: 'other',
    label: 'Outros',
    icon: '📦',
    color: theme.colors.secondaryText,
    backgroundColor: theme.colors.surfaceSecondary,
    type: 'expense',
  },
];

export function getCategoriesByType(type: TransactionType) {
  return CATEGORY_OPTIONS.filter((category) => {
    return category.type === type || category.id === 'other';
  });
}

export function getCategoryMeta(categoryId: string): CategoryMeta {
  return (
    CATEGORY_OPTIONS.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: '•',
      color: theme.colors.secondaryText,
      backgroundColor: theme.colors.surfaceSecondary,
      type: 'expense',
    }
  );
}

