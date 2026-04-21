import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/src/components/ui/Button';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface EmptyStateProps extends ViewProps {
  iconName: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  message: string;
  actionLabel?: string;
  actionVariant?: React.ComponentProps<typeof Button>['variant'];
  onAction?: () => void;
}

export function EmptyState({
  iconName,
  title,
  message,
  actionLabel,
  actionVariant = 'primary',
  onAction,
  style,
  ...rest
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={iconName} size={34} color={theme.colors.primary} />
      </View>
      <Spacer size="sm" />
      <Typography variant="body" weight="semibold" color={theme.colors.primaryText} align="center">
        {title}
      </Typography>
      <Spacer size="xs" />
      <Typography variant="body" color={theme.colors.secondaryText} align="center">
        {message}
      </Typography>
      {actionLabel && onAction && (
        <>
          <Spacer size="lg" />
          <Button
            label={actionLabel}
            variant={actionVariant}
            onPress={onAction}
            style={styles.action}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryBackground,
  },
  action: {
    alignSelf: 'stretch',
  },
});
