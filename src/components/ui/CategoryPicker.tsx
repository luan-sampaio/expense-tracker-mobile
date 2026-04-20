import { getCategoriesByType } from '@/src/constants/categories';
import { theme } from '@/src/styles/theme';
import { TransactionType } from '@/src/types';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from './Typography';

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  type: TransactionType;
}

export function CategoryPicker({ selectedCategory, onSelectCategory, type }: CategoryPickerProps) {
  const categories = getCategoriesByType(type);

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
                {
                  backgroundColor: category.backgroundColor,
                },
                isSelected && styles.categoryItemSelected,
                isSelected && { borderColor: category.color },
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
                color={isSelected ? category.color : theme.colors.secondaryText}
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
    ...theme.shadows.sm,
  },
  icon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
});
