import { Transaction } from '@/src/types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_IN_MS).toISOString();
}

export function createDemoTransactions(): Transaction[] {
  return [
    {
      id: 'demo-income-salary-current',
      amount: 5200,
      date: daysAgo(3),
      category: 'salary',
      type: 'income',
      description: 'Salario mensal',
    },
    {
      id: 'demo-income-freelance',
      amount: 850,
      date: daysAgo(9),
      category: 'freelance',
      type: 'income',
      description: 'Projeto freelance landing page',
    },
    {
      id: 'demo-expense-market',
      amount: 342.76,
      date: daysAgo(1),
      category: 'food',
      type: 'expense',
      description: 'Mercado da semana com descricao maior para testar quebra de linha',
    },
    {
      id: 'demo-expense-rent',
      amount: 1450,
      date: daysAgo(4),
      category: 'housing',
      type: 'expense',
      description: 'Aluguel',
    },
    {
      id: 'demo-expense-transport',
      amount: 87.5,
      date: daysAgo(5),
      category: 'transport',
      type: 'expense',
      description: 'Combustivel',
    },
    {
      id: 'demo-expense-health',
      amount: 129.9,
      date: daysAgo(7),
      category: 'health',
      type: 'expense',
      description: 'Farmacia',
    },
    {
      id: 'demo-expense-streaming',
      amount: 39.9,
      date: daysAgo(11),
      category: 'entertainment',
      type: 'expense',
      description: 'Assinatura streaming',
    },
    {
      id: 'demo-expense-course',
      amount: 220,
      date: daysAgo(13),
      category: 'education',
      type: 'expense',
      description: 'Curso online',
    },
    {
      id: 'demo-expense-bills',
      amount: 312.42,
      date: daysAgo(16),
      category: 'bills',
      type: 'expense',
      description: 'Energia e internet',
    },
    {
      id: 'demo-expense-shopping',
      amount: 249.99,
      date: daysAgo(19),
      category: 'shopping',
      type: 'expense',
      description: 'Tenis em promocao',
    },
    {
      id: 'demo-income-investment',
      amount: 118.64,
      date: daysAgo(21),
      category: 'investment',
      type: 'income',
      description: 'Rendimento investimento',
    },
    {
      id: 'demo-expense-restaurant',
      amount: 96.3,
      date: daysAgo(23),
      category: 'food',
      type: 'expense',
      description: 'Jantar fora',
    },
    {
      id: 'demo-prev-income-salary',
      amount: 5000,
      date: daysAgo(36),
      category: 'salary',
      type: 'income',
      description: 'Salario mes anterior',
    },
    {
      id: 'demo-prev-expense-market',
      amount: 510.2,
      date: daysAgo(39),
      category: 'food',
      type: 'expense',
      description: 'Compras do mes anterior',
    },
    {
      id: 'demo-prev-expense-rent',
      amount: 1450,
      date: daysAgo(42),
      category: 'housing',
      type: 'expense',
      description: 'Aluguel mes anterior',
    },
    {
      id: 'demo-prev-expense-travel',
      amount: 680,
      date: daysAgo(47),
      category: 'entertainment',
      type: 'expense',
      description: 'Fim de semana fora',
    },
  ];
}
