import { theme } from '@/src/styles/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';
import { Typography } from '@/src/components/ui/Typography';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconPosition?: 'left' | 'right';
}

const BUTTON_VARIANTS = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    textColor: theme.colors.surface,
    hasShadow: true,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderColor: theme.colors.border,
    textColor: theme.colors.primaryText,
    hasShadow: false,
  },
  success: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
    textColor: theme.colors.surface,
    hasShadow: true,
  },
  danger: {
    backgroundColor: theme.colors.expense,
    borderColor: theme.colors.expense,
    textColor: theme.colors.surface,
    hasShadow: true,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: theme.colors.primary,
    hasShadow: false,
  },
} as const;

const BUTTON_SIZES = {
  sm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    textVariant: 'caption',
    iconSize: 16,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
    textVariant: 'body',
    iconSize: 20,
  },
  lg: {
    minHeight: 58,
    paddingHorizontal: theme.spacing.xl,
    textVariant: 'body',
    iconSize: 22,
  },
} as const;

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  iconName,
  iconPosition = 'left',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const isVisuallyDisabled = Boolean(disabled) && !isLoading;
  const variantConfig = BUTTON_VARIANTS[variant];
  const sizeConfig = BUTTON_SIZES[size];
  const textColor = isVisuallyDisabled ? theme.colors.tertiaryText : variantConfig.textColor;
  const backgroundColor = isVisuallyDisabled && variant !== 'ghost'
    ? theme.colors.borderLight
    : variantConfig.backgroundColor;
  const borderColor = isVisuallyDisabled && variant !== 'ghost'
    ? theme.colors.border
    : variantConfig.borderColor;
  const showIcon = iconName && !isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          minHeight: sizeConfig.minHeight,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          backgroundColor,
          borderColor,
        },
        variantConfig.hasShadow && !isDisabled && theme.shadows.sm,
        isVisuallyDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {showIcon && iconPosition === 'left' && (
            <MaterialIcons name={iconName} size={sizeConfig.iconSize} color={textColor} />
          )}
          <Typography
            variant={sizeConfig.textVariant}
            weight="semibold"
            color={textColor}
            align="center"
            numberOfLines={1}
          >
            {label}
          </Typography>
          {showIcon && iconPosition === 'right' && (
            <MaterialIcons name={iconName} size={sizeConfig.iconSize} color={textColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  disabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
});
