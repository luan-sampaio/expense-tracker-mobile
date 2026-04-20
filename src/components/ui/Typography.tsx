import React from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '@/src/styles/theme';

interface TypographyProps extends TextProps {
  variant?: 'caption' | 'body' | 'title' | 'heading' | 'hero';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Typography({
  variant = 'body',
  weight = 'regular',
  color = theme.colors.primaryText,
  align = 'left',
  style,
  children,
  ...rest
}: TypographyProps) {
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.sizes[variant],
          fontWeight: theme.typography.weights[weight],
          color,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
