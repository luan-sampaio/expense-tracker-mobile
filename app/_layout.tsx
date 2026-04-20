import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const syncAll = useExpenseStore((state) => state.syncAll);

  useEffect(() => {
    syncAll();

    const interval = setInterval(() => {
      syncAll({ silent: true });
    }, 15000);

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        syncAll({ silent: true });
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [syncAll]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Nova Transação' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
