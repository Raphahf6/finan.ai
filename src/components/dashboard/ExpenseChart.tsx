import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseChartProps {
  transactions: any[]; // Recebe as transações reais do Dashboard
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  // 1. Lógica para agrupar dados dos últimos 6 meses
  const generateChartData = () => {
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthName = format(monthDate, 'MMM', { locale: ptBR });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      // Filtra transações deste mês específico
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      last6Months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        income,
        expenses,
      });
    }
    return last6Months;
  };

  const chartData = generateChartData();

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Evolução Financeira</h3>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-income" />
            <span className="text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-expense" />
            <span className="text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: number) => [
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(value),
              ]}
            />
            <Bar 
              dataKey="income" 
              name="Receitas"
              fill="hsl(var(--income))" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar 
              dataKey="expenses" 
              name="Despesas"
              fill="hsl(var(--expense))" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}