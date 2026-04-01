import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from './Typography';

export type Period = 'week' | 'month' | 'year' | 'all';

interface PeriodFilterProps {
  selectedPeriod: Period;
  onSelectPeriod: (period: Period) => void;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
];

export function PeriodFilter({ selectedPeriod, onSelectPeriod }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      {PERIODS.map((period) => {
        const isSelected = selectedPeriod === period.id;
        return (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              isSelected && styles.periodButtonSelected,
            ]}
            onPress={() => onSelectPeriod(period.id)}
            activeOpacity={0.7}
          >
            <Typography
              variant="body"
              weight={isSelected ? 'semibold' : 'regular'}
              color={isSelected ? theme.colors.primary : theme.colors.secondaryText}
            >
              {period.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  periodButtonSelected: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
});
