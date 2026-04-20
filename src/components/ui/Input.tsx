import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Spacer } from './Spacer';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <>
          <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
            {label}
          </Typography>
          <Spacer size="xs" />
        </>
      )}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityHint={error}
        placeholderTextColor={theme.colors.secondaryText}
        {...rest}
      />
      {error && (
        <>
          <Spacer size="xs" />
          <Typography variant="caption" color={theme.colors.expense}>
            {error}
          </Typography>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: theme.colors.surface,
    minHeight: 52,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.primaryText,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  inputError: {
    borderColor: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
  },
});
