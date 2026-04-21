import { impactFeedback } from '@/src/utils/haptics';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Typography } from '@/src/components/ui/Typography';

interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const CHIP_VARIANTS = {
  neutral: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderColor: theme.colors.border,
    textColor: theme.colors.secondaryText,
    selectedBackgroundColor: theme.colors.primaryBackground,
    selectedBorderColor: theme.colors.primary,
    selectedTextColor: theme.colors.primary,
  },
  primary: {
    backgroundColor: theme.colors.primaryBackground,
    borderColor: theme.colors.primary,
    textColor: theme.colors.primary,
    selectedBackgroundColor: theme.colors.primary,
    selectedBorderColor: theme.colors.primary,
    selectedTextColor: theme.colors.surface,
  },
  success: {
    backgroundColor: theme.colors.incomeBackground,
    borderColor: theme.colors.incomeBorder,
    textColor: theme.colors.success,
    selectedBackgroundColor: theme.colors.success,
    selectedBorderColor: theme.colors.success,
    selectedTextColor: theme.colors.surface,
  },
  warning: {
    backgroundColor: theme.colors.accentBackground,
    borderColor: theme.colors.accent,
    textColor: theme.colors.warning,
    selectedBackgroundColor: theme.colors.warning,
    selectedBorderColor: theme.colors.warning,
    selectedTextColor: theme.colors.surface,
  },
  danger: {
    backgroundColor: theme.colors.expenseBackground,
    borderColor: theme.colors.expenseBorder,
    textColor: theme.colors.expense,
    selectedBackgroundColor: theme.colors.expense,
    selectedBorderColor: theme.colors.expense,
    selectedTextColor: theme.colors.surface,
  },
} as const;

export function Chip({
  label,
  selected = false,
  variant = 'neutral',
  size = 'md',
  onPress,
  style,
  disabled,
  ...rest
}: ChipProps) {
  const config = CHIP_VARIANTS[variant];
  const textColor = selected ? config.selectedTextColor : config.textColor;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        size === 'sm' && styles.small,
        {
          backgroundColor: selected ? config.selectedBackgroundColor : config.backgroundColor,
          borderColor: selected ? config.selectedBorderColor : config.borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={(event) => {
        impactFeedback();
        onPress?.(event);
      }}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={rest.accessibilityLabel ?? label}
      {...rest}
    >
      <Typography
        variant="caption"
        weight={selected ? 'semibold' : 'regular'}
        color={disabled ? theme.colors.tertiaryText : textColor}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  small: {
    minHeight: 28,
    paddingHorizontal: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.55,
  },
});
