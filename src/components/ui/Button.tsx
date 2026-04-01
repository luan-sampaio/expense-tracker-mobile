import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '@/src/styles/theme';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'primary': return theme.colors.primaryText; // Black button for minimalist look
      case 'secondary': return theme.colors.surface;
      case 'danger': return theme.colors.expense;
      case 'ghost': return 'transparent';
      default: return theme.colors.primaryText;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.secondaryText;
    switch (variant) {
      case 'primary': return theme.colors.background;
      case 'secondary': return theme.colors.primaryText;
      case 'danger': return theme.colors.background;
      case 'ghost': return theme.colors.primaryText;
      default: return theme.colors.background;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Typography
          variant="body"
          weight="semibold"
          color={getTextColor()}
          align="center"
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
