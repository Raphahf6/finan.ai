import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'balance';
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    income: 'bg-income/10 border-income/20',
    expense: 'bg-expense/10 border-expense/20',
    balance: 'gradient-primary text-primary-foreground border-0',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    income: 'bg-income/20 text-income',
    expense: 'bg-expense/20 text-expense',
    balance: 'bg-primary-foreground/20 text-primary-foreground',
  };

  return (
    <div
      className={cn(
        'stat-card rounded-2xl border p-4 md:p-6',
        variantStyles[variant],
        variant === 'balance' && 'glow-primary',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            iconStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trend.isPositive
                ? 'bg-income/20 text-income'
                : 'bg-expense/20 text-expense'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p
        className={cn(
          'text-sm font-medium mb-1',
          variant === 'balance' ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          'text-2xl md:text-3xl font-bold tracking-tight',
          variant === 'balance' && 'text-primary-foreground'
        )}
      >
        {value}
      </p>
    </div>
  );
}
