import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Typography } from '@/src/components/ui/Typography';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends ViewProps {
  label: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const VARIANT_COLORS = {
  primary: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
  },
  success: {
    backgroundColor: theme.colors.incomeBackground,
    color: theme.colors.success,
  },
  warning: {
    backgroundColor: theme.colors.accentBackground,
    color: theme.colors.warning,
  },
  danger: {
    backgroundColor: theme.colors.expenseBackground,
    color: theme.colors.expense,
  },
  neutral: {
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.secondaryText,
  },
} as const;

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  ...rest
}: BadgeProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <View
      style={[
        styles.container,
        size === 'sm' && styles.small,
        { backgroundColor: colors.backgroundColor },
        style,
      ]}
      {...rest}
    >
      <Typography variant="caption" weight="bold" color={colors.color} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 22,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  small: {
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
  },
});
