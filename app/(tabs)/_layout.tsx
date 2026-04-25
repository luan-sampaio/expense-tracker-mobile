import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { theme } from '@/src/styles/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tertiaryText,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: theme.typography.sizes.caption,
          fontWeight: theme.typography.weights.semibold,
        },
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: theme.spacing.sm,
          paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
          backgroundColor: theme.colors.surfaceElevated,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          shadowColor: '#2D2A26',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.pie.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
