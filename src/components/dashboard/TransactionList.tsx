import { Transaction } from '@/types/finance';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
}

export function TransactionList({ transactions, limit }: TransactionListProps) {
  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Transações Recentes</h3>
        <a href="/extrato" className="text-sm text-primary hover:underline">
          Ver todas
        </a>
      </div>
      <div className="space-y-2">
        {displayedTransactions.map((transaction, index) => (
          <div
            key={transaction.id}
            className="transaction-item animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className="category-icon"
              style={{ backgroundColor: `${transaction.category?.color}20` }}
            >
              <CategoryIcon
                icon={transaction.category?.icon || 'circle'}
                color={transaction.category?.color}
                size={18}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {transaction.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}
                {transaction.status === 'pending' && (
                  <span className="ml-2 text-pending">• Pendente</span>
                )}
              </p>
            </div>
            <span
              className={cn(
                'font-semibold tabular-nums',
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              )}
            >
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
