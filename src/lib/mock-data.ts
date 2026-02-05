import { Category, Transaction, Goal, Budget, MonthlyData } from '@/types/finance';

// Mock categories (simulating system categories from database)
export const mockCategories: Category[] = [
  { id: '1', name: 'Salário', icon: 'briefcase', type: 'income', color: '#10b981', user_id: null, created_at: new Date().toISOString() },
  { id: '2', name: 'Freelance', icon: 'laptop', type: 'income', color: '#06b6d4', user_id: null, created_at: new Date().toISOString() },
  { id: '3', name: 'Investimentos', icon: 'trending-up', type: 'income', color: '#8b5cf6', user_id: null, created_at: new Date().toISOString() },
  { id: '4', name: 'Outros Ganhos', icon: 'plus-circle', type: 'income', color: '#22c55e', user_id: null, created_at: new Date().toISOString() },
  { id: '5', name: 'Alimentação', icon: 'utensils', type: 'expense', color: '#ef4444', user_id: null, created_at: new Date().toISOString() },
  { id: '6', name: 'Transporte', icon: 'car', type: 'expense', color: '#f97316', user_id: null, created_at: new Date().toISOString() },
  { id: '7', name: 'Moradia', icon: 'home', type: 'expense', color: '#eab308', user_id: null, created_at: new Date().toISOString() },
  { id: '8', name: 'Saúde', icon: 'heart', type: 'expense', color: '#ec4899', user_id: null, created_at: new Date().toISOString() },
  { id: '9', name: 'Educação', icon: 'book-open', type: 'expense', color: '#6366f1', user_id: null, created_at: new Date().toISOString() },
  { id: '10', name: 'Lazer', icon: 'gamepad-2', type: 'expense', color: '#14b8a6', user_id: null, created_at: new Date().toISOString() },
  { id: '11', name: 'Compras', icon: 'shopping-bag', type: 'expense', color: '#f43f5e', user_id: null, created_at: new Date().toISOString() },
  { id: '12', name: 'Assinaturas', icon: 'credit-card', type: 'expense', color: '#a855f7', user_id: null, created_at: new Date().toISOString() },
];

// Mock transactions for demo (healthy financial situation)
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 8500,
    description: 'Salário Mensal',
    date: '2026-02-01',
    type: 'income',
    category_id: '1',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[0],
  },
  {
    id: '2',
    amount: 2500,
    description: 'Projeto Freelance - Website',
    date: '2026-02-03',
    type: 'income',
    category_id: '2',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[1],
  },
  {
    id: '3',
    amount: 1200,
    description: 'Aluguel',
    date: '2026-02-05',
    type: 'expense',
    category_id: '7',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[6],
  },
  {
    id: '4',
    amount: 450,
    description: 'Supermercado',
    date: '2026-02-02',
    type: 'expense',
    category_id: '5',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[4],
  },
  {
    id: '5',
    amount: 89.90,
    description: 'Netflix + Spotify',
    date: '2026-02-01',
    type: 'expense',
    category_id: '12',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[11],
  },
  {
    id: '6',
    amount: 200,
    description: 'Uber/99',
    date: '2026-02-04',
    type: 'expense',
    category_id: '6',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[5],
  },
  {
    id: '7',
    amount: 350,
    description: 'Dividendos Ações',
    date: '2026-01-28',
    type: 'income',
    category_id: '3',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[2],
  },
  {
    id: '8',
    amount: 180,
    description: 'Jantar Restaurante',
    date: '2026-02-03',
    type: 'expense',
    category_id: '10',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[9],
  },
  {
    id: '9',
    amount: 500,
    description: 'Curso Online',
    date: '2026-02-02',
    type: 'expense',
    category_id: '9',
    user_id: 'demo',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[8],
  },
  {
    id: '10',
    amount: 150,
    description: 'Farmácia',
    date: '2026-02-01',
    type: 'expense',
    category_id: '8',
    user_id: 'demo',
    status: 'paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories[7],
  },
];

// Mock goals
export const mockGoals: Goal[] = [
  {
    id: '1',
    name: 'Viagem para Europa',
    icon: 'plane',
    target_amount: 15000,
    current_amount: 8500,
    color: '#06b6d4',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Reserva de Emergência',
    icon: 'shield',
    target_amount: 30000,
    current_amount: 22000,
    color: '#10b981',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Carro Novo',
    icon: 'car',
    target_amount: 80000,
    current_amount: 25000,
    color: '#8b5cf6',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock budgets
export const mockBudgets: Budget[] = [
  { id: '1', category_id: '5', limit_amount: 800, month: 2, year: 2026, user_id: 'demo', created_at: new Date().toISOString(), category: mockCategories[4], spent: 450 },
  { id: '2', category_id: '6', limit_amount: 500, month: 2, year: 2026, user_id: 'demo', created_at: new Date().toISOString(), category: mockCategories[5], spent: 200 },
  { id: '3', category_id: '10', limit_amount: 600, month: 2, year: 2026, user_id: 'demo', created_at: new Date().toISOString(), category: mockCategories[9], spent: 180 },
  { id: '4', category_id: '12', limit_amount: 200, month: 2, year: 2026, user_id: 'demo', created_at: new Date().toISOString(), category: mockCategories[11], spent: 89.90 },
];

// Mock monthly data for chart (last 6 months - healthy trend)
export const mockMonthlyData: MonthlyData[] = [
  { month: 'Set', income: 9200, expenses: 4800 },
  { month: 'Out', income: 8800, expenses: 5200 },
  { month: 'Nov', income: 10500, expenses: 4500 },
  { month: 'Dez', income: 12000, expenses: 7200 },
  { month: 'Jan', income: 9500, expenses: 4200 },
  { month: 'Fev', income: 11350, expenses: 3069.90 },
];

// Calculate summary from transactions
export function calculateSummary(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = monthlyTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pending = monthlyTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    balance: income - expenses,
    income,
    expenses,
    pending,
  };
}
