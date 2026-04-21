import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/src/components/ui/Button';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { theme } from '@/src/styles/theme';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type DialogVariant = 'success' | 'error' | 'warning' | 'info';

interface AppDialogProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isDanger?: boolean;
}

const VARIANT_CONFIG = {
  success: {
    icon: 'check-circle',
    color: theme.colors.success,
    backgroundColor: theme.colors.incomeBackground,
  },
  error: {
    icon: 'error',
    color: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
  },
  warning: {
    icon: 'warning',
    color: theme.colors.warning,
    backgroundColor: theme.colors.accentBackground,
  },
  info: {
    icon: 'info',
    color: theme.colors.info,
    backgroundColor: theme.colors.infoBackground,
  },
} as const;

export function AppDialog({
  visible,
  title,
  message,
  variant = 'info',
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
  isDanger = false,
}: AppDialogProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel ?? onConfirm}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={styles.dialog}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${message}`}
        >
          <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
            <MaterialIcons name={config.icon} size={30} color={config.color} />
          </View>
          <Spacer size="md" />
          <Typography variant="title" weight="bold" align="center">
            {title}
          </Typography>
          <Spacer size="sm" />
          <Typography variant="body" color={theme.colors.secondaryText} align="center">
            {message}
          </Typography>
          <Spacer size="xl" />
          <View style={styles.actions}>
            {cancelLabel && onCancel && (
              <Button
                label={cancelLabel}
                variant="secondary"
                style={styles.cancelButton}
                onPress={onCancel}
                accessibilityLabel={cancelLabel}
              />
            )}
            <Button
              label={confirmLabel}
              variant={isDanger ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.confirmButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(45, 42, 38, 0.42)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
