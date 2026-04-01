export const theme = {
  colors: {
    // Backgrounds — tons quentes de creme/areia
    background: '#FBF8F4',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F0EA',
    surfaceElevated: '#FFFDF9',

    // Primary — verde esmeralda sofisticado
    primary: '#1B9C85',
    primaryLight: '#2CC5A6',
    primaryDark: '#14796A',
    primaryBackground: '#E8F6F3',

    // Text — tons escuros quentes
    primaryText: '#2D2A26',
    secondaryText: '#7A756D',
    tertiaryText: '#A9A39A',

    // Borders & Dividers — quentes
    border: '#E8E2D9',
    borderLight: '#F0EBE4',

    // Income — verde menta
    income: '#1B9C85',
    incomeLight: '#2CC5A6',
    incomeBackground: '#E8F6F3',
    incomeBorder: '#B3E4DA',

    // Expense — coral/terracota quente
    expense: '#D4634A',
    expenseLight: '#E8816C',
    expenseBackground: '#FDF0ED',
    expenseBorder: '#F2C4B9',

    // Accent colors
    accent: '#D4A04A',
    accentBackground: '#FDF5E6',
    info: '#5B8DB8',
    infoBackground: '#EAF1F7',
    success: '#1B9C85',
    warning: '#D4A04A',
    danger: '#D4634A',
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
    xl: 28,
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#2D2A26',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#2D2A26',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#2D2A26',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
  },
};

export type ThemeType = typeof theme;
