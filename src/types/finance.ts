export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  color: string;
  user_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id: string | null;
  user_id: string;
  status: 'paid' | 'pending';
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  limit_amount: number;
  month: number;
  year: number;
  user_id: string;
  created_at: string;
  category?: Category;
  spent?: number;
}

export interface FinancialSummary {
  balance: number;
  income: number;
  expenses: number;
  pending: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}
