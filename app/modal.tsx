import { AppDialog } from '@/src/components/ui/AppDialog';
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
import { formatCurrency } from '@/src/utils/formatters';
import { errorFeedback, impactFeedback, successFeedback } from '@/src/utils/haptics';
import { parseAmount, TransactionFormErrors, validateTransactionForm } from '@/src/utils/validation';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

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

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const cents = Number(digits || '0');

  if (cents === 0) return '';

  return formatCurrency(cents / 100);
}

function formatInitialAmount(value: string | undefined) {
  if (!value) return '';

  const numeric = parseAmount(value);
  if (Number.isNaN(numeric)) return value;

  return formatCurrency(numeric);
}

export default function ModalScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addTransaction, updateTransaction } = useExpenseStore(
    useShallow((state) => ({
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction,
    }))
  );
  
  const isEditing = !!params.editId;
  const editId = params.editId as string | undefined;

  const [type, setType] = useState<TransactionType>((params.editType as TransactionType) || 'expense');
  const [amount, setAmount] = useState(() => formatInitialAmount(params.editAmount as string | undefined));
  const [description, setDescription] = useState((params.editDescription as string) || '');
  const [category, setCategory] = useState<string>((params.editCategory as string) || 'other');
  const [date, setDate] = useState(() => {
    const editDate = params.editDate as string | undefined;
    return editDate ? new Date(editDate) : new Date();
  });
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'success',
  });
  const [errors, setErrors] = useState<TransactionFormErrors>({ amount: '', description: '' });

  const showSaveFeedback = () => {
    successFeedback();
    const message = isEditing
      ? 'Transação atualizada com sucesso.'
      : 'Transação adicionada com sucesso.';

    setDialog({
      visible: true,
      title: 'Tudo certo',
      message,
      variant: 'success',
    });
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

  const handleAmountChange = (text: string) => {
    setAmount(formatAmountInput(text));
    if (errors.amount) setErrors({ ...errors, amount: '' });
  };

  const handleSave = () => {
    if (isSaving) return;

    const { errors: newErrors, isValid } = validateTransactionForm({ amount, description });
    setErrors(newErrors);
    if (!isValid) {
      errorFeedback();
      setDialog({
        visible: true,
        title: 'Revise os campos',
        message: 'Por favor, preencha todos os campos corretamente.',
        variant: 'error',
      });
      return;
    }

    const numericAmount = parseAmount(amount);
    setIsSaving(true);

    setTimeout(() => {
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

      setIsSaving(false);
      showSaveFeedback();
    }, 250);
  };

  return (
    <Container padding={0}>
      <Stack.Screen options={{ title: isEditing ? 'Editar transação' : 'Nova transação' }} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Typography variant="title" weight="bold">
              {isEditing ? 'Editar transação' : 'Nova transação'}
            </Typography>
            <Typography variant="body" color={theme.colors.secondaryText}>
              Informe os dados principais para manter seu controle atualizado.
            </Typography>
          </View>

          <Spacer size="xl" />

          <Typography variant="caption" weight="medium" color={theme.colors.secondaryText}>
            Tipo
          </Typography>
          <Spacer size="xs" />
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === 'expense' && styles.expenseOptionSelected,
              ]}
              onPress={() => handleTypeChange('expense')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Selecionar tipo despesa"
              accessibilityState={{ selected: type === 'expense' }}
            >
              <MaterialIcons
                name="arrow-downward"
                size={20}
                color={type === 'expense' ? theme.colors.expense : theme.colors.secondaryText}
              />
              <Typography
                variant="body"
                weight="semibold"
                color={type === 'expense' ? theme.colors.expense : theme.colors.primaryText}
              >
                Despesa
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                type === 'income' && styles.incomeOptionSelected,
              ]}
              onPress={() => handleTypeChange('income')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Selecionar tipo receita"
              accessibilityState={{ selected: type === 'income' }}
            >
              <MaterialIcons
                name="arrow-upward"
                size={20}
                color={type === 'income' ? theme.colors.income : theme.colors.secondaryText}
              />
              <Typography
                variant="body"
                weight="semibold"
                color={type === 'income' ? theme.colors.income : theme.colors.primaryText}
              >
                Receita
              </Typography>
            </TouchableOpacity>
          </View>

          <Spacer size="lg" />

          <Input
            label="Valor"
            accessibilityLabel="Valor da transação"
            placeholder="R$ 0,00"
            keyboardType="number-pad"
            value={amount}
            onChangeText={handleAmountChange}
            error={errors.amount}
          />
          <Spacer size="lg" />

          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={setCategory}
            type={type}
          />
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
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.secondaryText} />
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

          <Input
            label="Descrição"
            accessibilityLabel="Descrição da transação"
            placeholder="Ex: Conta de luz, salário"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            error={errors.description}
            returnKeyType="done"
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) },
          ]}
        >
          <Button
            label={isEditing ? 'Salvar alterações' : 'Salvar transação'}
            onPress={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          />
        </View>
      </KeyboardAvoidingView>

      <AppDialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel="OK"
        onConfirm={() => {
          const shouldGoBack = dialog.variant === 'success';
          setDialog((current) => ({ ...current, visible: false }));
          if (shouldGoBack) {
            router.back();
          }
        }}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    gap: theme.spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.md,
  },
  typeOption: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  expenseOptionSelected: {
    borderColor: theme.colors.expense,
    backgroundColor: theme.colors.expenseBackground,
  },
  incomeOptionSelected: {
    borderColor: theme.colors.income,
    backgroundColor: theme.colors.incomeBackground,
  },
  dateButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
});
