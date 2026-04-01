import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Container } from '@/src/components/ui/Container';
import { Spacer } from '@/src/components/ui/Spacer';
import { BalanceHeader } from '@/src/components/dashboard/BalanceHeader';
import { Typography } from '@/src/components/ui/Typography';
import { theme } from '@/src/styles/theme';

export default function HomeScreen() {
  return (
    <Container padding={0} backgroundColor={theme.colors.background}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Spacer size="xxl" />
        
        <BalanceHeader />
        
        <Spacer size="xxl" />
        
        <Container padding="lg" flex={0}>
          <Typography variant="title" weight="semibold">
            Transações Recentes
          </Typography>
          <Spacer size="lg" />
          
          {/* Placeholder for now until Fase 6 */}
          <Container padding="lg" backgroundColor={theme.colors.surface} style={styles.emptyCard}>
            <Typography variant="body" color={theme.colors.secondaryText} align="center">
              Nenhuma transação ainda.
            </Typography>
          </Container>
        </Container>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  emptyCard: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  }
});
