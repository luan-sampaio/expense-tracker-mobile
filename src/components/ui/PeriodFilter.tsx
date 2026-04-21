import { Chip } from '@/src/components/ui/Chip';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
          <Chip
            key={period.id}
            label={period.label}
            selected={isSelected}
            style={styles.periodButton}
            onPress={() => onSelectPeriod(period.id)}
            accessibilityLabel={`Filtrar período ${period.label}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    minWidth: 72,
    minHeight: 44,
    borderRadius: theme.borderRadius.sm,
  },
});
