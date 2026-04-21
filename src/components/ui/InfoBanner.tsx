import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/src/components/ui/Button';
import { Typography } from '@/src/components/ui/Typography';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewProps } from 'react-native';

type InfoBannerVariant = 'info' | 'success' | 'warning' | 'danger';

interface InfoBannerProps extends ViewProps {
  title: string;
  message?: string;
  variant?: InfoBannerVariant;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  isLoading?: boolean;
  actionLabel?: string;
  actionVariant?: React.ComponentProps<typeof Button>['variant'];
  onAction?: () => void;
}

const VARIANT_CONFIG = {
  info: {
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
    borderColor: theme.colors.info,
  },
  success: {
    color: theme.colors.success,
    backgroundColor: theme.colors.incomeBackground,
    borderColor: theme.colors.incomeBorder,
  },
  warning: {
    color: theme.colors.warning,
    backgroundColor: theme.colors.accentBackground,
    borderColor: theme.colors.accent,
  },
  danger: {
    color: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
    borderColor: theme.colors.expenseBorder,
  },
};

export function InfoBanner({
  title,
  message,
  variant = 'info',
  iconName = 'info',
  isLoading = false,
  actionLabel,
  actionVariant = 'secondary',
  onAction,
  style,
  ...rest
}: InfoBannerProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {isLoading ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <MaterialIcons name={iconName} size={20} color={config.color} />
          )}
          <Typography variant="body" weight="semibold" color={config.color}>
            {title}
          </Typography>
        </View>
        {message && (
          <Typography variant="caption" color={theme.colors.secondaryText}>
            {message}
          </Typography>
        )}
      </View>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant={actionVariant}
          size="sm"
          onPress={onAction}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  header: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  action: {
    alignSelf: 'flex-start',
  },
});
