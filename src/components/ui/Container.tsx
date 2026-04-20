import React from 'react';
import { View, ViewProps } from 'react-native';
import { theme } from '@/src/styles/theme';

interface ContainerProps extends ViewProps {
  padding?: keyof typeof theme.spacing | 0;
  backgroundColor?: string;
  flex?: number;
}

export function Container({
  padding = 'lg',
  backgroundColor = theme.colors.background,
  flex = 1,
  style,
  children,
  ...rest
}: ContainerProps) {
  return (
    <View
      style={[
        {
          flex,
          backgroundColor,
          padding: padding === 0 ? 0 : theme.spacing[padding],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
