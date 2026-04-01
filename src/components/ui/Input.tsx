import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { theme } from '@/src/styles/theme';
import { Typography } from './Typography';
import { Spacer } from './Spacer';

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
    height: 52,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.primaryText,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: theme.colors.expense,
  },
});
