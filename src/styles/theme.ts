export const theme = {
  colors: {
    // Backgrounds — tons quentes de creme/areia
    background: '#FBF8F4',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F0EA',
    surfaceElevated: '#FFFDF9',

    // Primary — verde esmeralda sofisticado
    primary: '#14796A',
    primaryLight: '#2CC5A6',
    primaryDark: '#14796A',
    primaryBackground: '#E8F6F3',

    // Text — tons escuros quentes
    primaryText: '#2D2A26',
    secondaryText: '#5F5A52',
    tertiaryText: '#6F695F',

    // Borders & Dividers — quentes
    border: '#E8E2D9',
    borderLight: '#F0EBE4',

    // Income — verde menta
    income: '#14796A',
    incomeLight: '#2CC5A6',
    incomeBackground: '#E8F6F3',
    incomeBorder: '#B3E4DA',

    // Expense — coral/terracota quente
    expense: '#B44632',
    expenseLight: '#E8816C',
    expenseBackground: '#FDF0ED',
    expenseBorder: '#F2C4B9',

    // Accent colors
    accent: '#8A5F12',
    accentBackground: '#FDF5E6',
    info: '#356C98',
    infoBackground: '#EAF1F7',
    success: '#14796A',
    warning: '#8A5F12',
    danger: '#B44632',
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
  touchTarget: {
    min: 44,
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
