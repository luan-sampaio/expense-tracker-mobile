import { theme } from '@/src/styles/theme';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from './Typography';

export type CategoryOption = {
  id: string;
  label: string;
  icon: string;
};

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { id: 'food', label: 'Alimentação', icon: '🍔' },
  { id: 'transport', label: 'Transporte', icon: '🚗' },
  { id: 'housing', label: 'Moradia', icon: '🏠' },
  { id: 'entertainment', label: 'Lazer', icon: '🎮' },
  { id: 'health', label: 'Saúde', icon: '💊' },
  { id: 'education', label: 'Educação', icon: '📚' },
  { id: 'shopping', label: 'Compras', icon: '🛍️' },
  { id: 'bills', label: 'Contas', icon: '📄' },
  { id: 'other', label: 'Outros', icon: '📦' },
];

const INCOME_CATEGORIES: CategoryOption[] = [
  { id: 'salary', label: 'Salário', icon: '💰' },
  { id: 'freelance', label: 'Freelance', icon: '💼' },
  { id: 'investment', label: 'Investimento', icon: '📈' },
  { id: 'gift', label: 'Presente', icon: '🎁' },
  { id: 'other', label: 'Outros', icon: '📦' },
];

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  type: 'income' | 'expense';
}

export function CategoryPicker({ selectedCategory, onSelectCategory, type }: CategoryPickerProps) {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="semibold" style={styles.label}>
        Categoria
      </Typography>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}
            >
              <Typography variant="heading" style={styles.icon}>
                {category.icon}
              </Typography>
              <Typography
                variant="caption"
                weight={isSelected ? 'semibold' : 'regular'}
                color={isSelected ? theme.colors.primary : theme.colors.secondaryText}
                align="center"
              >
                {category.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  scrollContent: {
    paddingVertical: theme.spacing.xs,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  categoryItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground,
    ...theme.shadows.sm,
  },
  icon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
});
