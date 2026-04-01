import React, { useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Container } from '@/src/components/ui/Container';
import { Typography } from '@/src/components/ui/Typography';
import { Spacer } from '@/src/components/ui/Spacer';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/styles/theme';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert('Erro ao Entrar', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Erro ao Cadastrar', error.message);
    } else if (!session) {
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para confirmar a conta.');
    } else {
      // Direct login successful
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <Container padding="xl" backgroundColor={theme.colors.background}>
      <View style={styles.centerContainer}>
        <Typography variant="hero" weight="bold">
          Bem-vindo
        </Typography>
        <Typography variant="body" color={theme.colors.secondaryText}>
          Acesse a nuvem do Expense Tracker Minimalista.
        </Typography>

        <Spacer size="xxl" />

        <Input
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Spacer size="lg" />
        
        <Input
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Spacer size="xxl" />

        <Button 
          label={loading ? "Carregando..." : "Entrar Seguro"}
          disabled={loading || !email || password.length < 6}
          onPress={signInWithEmail} 
          variant="primary" 
        />
        <Spacer size="md" />
        <Button 
          label="Criar nova conta" 
          disabled={loading || !email || password.length < 6}
          onPress={signUpWithEmail} 
          variant="secondary" 
        />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  }
});
