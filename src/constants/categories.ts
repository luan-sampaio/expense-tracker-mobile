import { theme } from '@/src/styles/theme';
import { BudgetGroupId, TransactionType } from '@/src/types';
import { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type CategoryIconName = ComponentProps<typeof MaterialIcons>['name'];

export type CategoryMeta = {
  id: string;
  label: string;
  iconName: CategoryIconName;
  color: string;
  backgroundColor: string;
  type: TransactionType;
  budgetGroup?: BudgetGroupId;
};

export const CATEGORY_OPTIONS: CategoryMeta[] = [
  {
    id: 'food',
    label: 'Alimentação',
    iconName: 'restaurant',
    color: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'transport',
    label: 'Transporte',
    iconName: 'directions-car',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'housing',
    label: 'Moradia',
    iconName: 'home',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryBackground,
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'entertainment',
    label: 'Lazer',
    iconName: 'sports-esports',
    color: '#8A5FBF',
    backgroundColor: '#F2ECFA',
    type: 'expense',
    budgetGroup: 'wants',
  },
  {
    id: 'health',
    label: 'Saúde',
    iconName: 'local-hospital',
    color: '#B84F6A',
    backgroundColor: '#FAEDF1',
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'education',
    label: 'Educação',
    iconName: 'school',
    color: '#5B6FB8',
    backgroundColor: '#EEF1FA',
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'shopping',
    label: 'Compras',
    iconName: 'shopping-bag',
    color: theme.colors.accent,
    backgroundColor: theme.colors.accentBackground,
    type: 'expense',
    budgetGroup: 'wants',
  },
  {
    id: 'bills',
    label: 'Contas',
    iconName: 'receipt-long',
    color: '#6F7A84',
    backgroundColor: '#EEF0F2',
    type: 'expense',
    budgetGroup: 'needs',
  },
  {
    id: 'investments',
    label: 'Investimentos',
    iconName: 'savings',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    type: 'expense',
    budgetGroup: 'savings',
  },
  {
    id: 'salary',
    label: 'Salário',
    iconName: 'payments',
    color: theme.colors.income,
    backgroundColor: theme.colors.incomeBackground,
    type: 'income',
  },
  {
    id: 'freelance',
    label: 'Freelance',
    iconName: 'work',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    type: 'income',
  },
  {
    id: 'investment',
    label: 'Investimento',
    iconName: 'trending-up',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryBackground,
    type: 'income',
    budgetGroup: 'savings',
  },
  {
    id: 'gift',
    label: 'Presente',
    iconName: 'card-giftcard',
    color: '#8A5FBF',
    backgroundColor: '#F2ECFA',
    type: 'income',
  },
  {
    id: 'other',
    label: 'Outros',
    iconName: 'category',
    color: theme.colors.secondaryText,
    backgroundColor: theme.colors.surfaceSecondary,
    type: 'expense',
    budgetGroup: 'wants',
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
      iconName: 'category',
      color: theme.colors.secondaryText,
      backgroundColor: theme.colors.surfaceSecondary,
      type: 'expense',
      budgetGroup: 'wants',
    }
  );
}
