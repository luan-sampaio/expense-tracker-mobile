export const theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F6F6F8',
    primary: '#007AFF',
    primaryBackground: '#E3F2FD',
    primaryText: '#1C1C1E',
    secondaryText: '#8E8E93',
    border: '#E5E5EA',
    income: '#34C759',
    incomeBackground: '#E8F5E9',
    expense: '#FF3B30',
    expenseBackground: '#FFEBEE',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    sizes: {
      caption: 12,
      body: 15,
      title: 20,
      heading: 28,
      hero: 40,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    } as const,
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 9999,
  },
};

export type ThemeType = typeof theme;
