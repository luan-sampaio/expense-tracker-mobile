import { Button } from '@/src/components/ui/Button';
import { CategoryPicker } from '@/src/components/ui/CategoryPicker';
import { Container } from '@/src/components/ui/Container';
import { Input } from '@/src/components/ui/Input';
import { Spacer } from '@/src/components/ui/Spacer';
import { Typography } from '@/src/components/ui/Typography';
import { getCategoriesByType } from '@/src/constants/categories';
import { useExpenseStore } from '@/src/store/useExpenseStore';
import { theme } from '@/src/styles/theme';
import { TransactionType } from '@/src/types';
import { errorFeedback, impactFeedback, successFeedback } from '@/src/utils/haptics';
import { parseAmount, TransactionFormErrors, validateTransactionForm } from '@/src/utils/validation';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, ToastAndroid, TouchableOpacity, View } from 'react-native';

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createDateFromInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function ModalScreen() {
  const params = useLocalSearchParams();
  const addTransaction = useExpenseStore((state) => state.addTransaction);
  const updateTransaction = useExpenseStore((state) => state.updateTransaction);
  
  const isEditing = !!params.editId;
  const editId = params.editId as string | undefined;

  const [type, setType] = useState<TransactionType>((params.editType as TransactionType) || 'expense');
  const [amount, setAmount] = useState((params.editAmount as string) || '');
  const [description, setDescription] = useState((params.editDescription as string) || '');
  const [category, setCategory] = useState<string>((params.editCategory as string) || 'other');
  const [date, setDate] = useState(() => {
    const editDate = params.editDate as string | undefined;
    return editDate ? new Date(editDate) : new Date();
  });
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState<TransactionFormErrors>({ amount: '', description: '' });

  const showSaveFeedback = () => {
    successFeedback();
    const message = isEditing
      ? 'Transação atualizada com sucesso.'
      : 'Transação adicionada com sucesso.';

    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      router.back();
      return;
    }

    Alert.alert('Tudo certo', message, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsDatePickerVisible(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTypeChange = (nextType: TransactionType) => {
    impactFeedback();
    const categories = getCategoriesByType(nextType);
    const categoryStillAvailable = categories.some((item) => item.id === category);

    setType(nextType);

    if (!categoryStillAvailable) {
      setCategory(categories[0]?.id ?? 'other');
    }
  };

  const handleSave = () => {
    const { errors: newErrors, isValid } = validateTransactionForm({ amount, description });
    setErrors(newErrors);
    if (!isValid) {
      errorFeedback();
      Alert.alert('Erro', 'Por favor, preencha todos os campos corretamente.');
      return;
    }

    const numericAmount = parseAmount(amount);

    if (isEditing && editId) {
      updateTransaction(editId, {
        amount: numericAmount,
        description: description.trim(),
        type,
        category: category.trim().toLowerCase(),
        date: date.toISOString(),
      });
    } else {
      addTransaction({
        amount: numericAmount,
        description: description.trim(),
        type,
        category: category.trim().toLowerCase(),
        date: date.toISOString(),
      });
    }
    
    showSaveFeedback();
  };

  return (
    <Container padding="lg">
      <Stack.Screen options={{ title: isEditing ? 'Editar Transação' : 'Nova Transação' }} />
      
      <Spacer size="xl" />
      <Typography variant="title" weight="bold">
        Tipo de Movimentação
      </Typography>
      <Spacer size="lg" />

      <View style={styles.typeSelector}>
        <Button 
          label="Despesa" 
          accessibilityLabel="Selecionar tipo despesa"
          variant={type === 'expense' ? 'danger' : 'secondary'} 
          style={styles.typeButton}
          onPress={() => handleTypeChange('expense')}
        />
        <Spacer size="md" horizontal />
        <Button 
          label="Receita" 
          accessibilityLabel="Selecionar tipo receita"
          variant={type === 'income' ? 'primary' : 'secondary'} 
          style={styles.typeButton}
          onPress={() => handleTypeChange('income')}
        />
      </View>
      <Spacer size="xl" />

      <Input 
        label="Valor (R$)" 
        accessibilityLabel="Valor da transação"
        placeholder="0,00" 
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(text) => {
          setAmount(text);
          if (errors.amount) setErrors({ ...errors, amount: '' });
        }}
      />
      {errors.amount ? (
        <Typography variant="caption" color={theme.colors.expense} style={{ marginTop: 4 }}>
          {errors.amount}
        </Typography>
      ) : null}
      <Spacer size="lg" />

      <Input 
        label="Descrição" 
        accessibilityLabel="Descrição da transação"
        placeholder="Ex: Conta de Luz, Salário" 
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          if (errors.description) setErrors({ ...errors, description: '' });
        }}
      />
      {errors.description ? (
        <Typography variant="caption" color={theme.colors.expense} style={{ marginTop: 4 }}>
          {errors.description}
        </Typography>
      ) : null}
      <Spacer size="lg" />

      <View>
        <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
          Data
        </Typography>
        <Spacer size="xs" />
        {Platform.OS === 'web' ? (
          <Input
            accessibilityLabel="Data da transação"
            value={formatDateInputValue(date)}
            onChangeText={(value) => {
              const nextDate = createDateFromInput(value);
              if (!Number.isNaN(nextDate.getTime())) {
                setDate(nextDate);
              }
            }}
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                impactFeedback();
                setIsDatePickerVisible(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar data da transação, atual ${formatDateLabel(date)}`}
            >
              <Typography variant="body" weight="semibold">
                {formatDateLabel(date)}
              </Typography>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </>
        )}
      </View>
      <Spacer size="lg" />

      <CategoryPicker 
        selectedCategory={category}
        onSelectCategory={setCategory}
        type={type}
      />
      <Spacer size="xxl" />

      <Button label={isEditing ? 'Salvar alterações' : 'Salvar'} onPress={handleSave} />
    </Container>
  );
}

const styles = StyleSheet.create({
  typeSelector: {
    flexDirection: 'row',
    width: '100%',
  },
  typeButton: {
    flex: 1,
  },
  dateButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
