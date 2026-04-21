import { Typography } from '@/src/components/ui/Typography';
import { theme } from '@/src/styles/theme';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface SectionHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
  ...rest
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.text}>
        <Typography variant="title" weight="semibold">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={theme.colors.secondaryText}>
            {subtitle}
          </Typography>
        )}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  text: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
