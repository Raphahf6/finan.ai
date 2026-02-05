import { Target, Plane, Shield, Car, TrendingUp, Loader2, Plus, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth } from 'date-fns';
import { NewGoalDialog } from '@/components/metas/NewGoalDialog';
import { DepositGoalDialog } from '@/components/metas/DepositGoalDialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const goalIcons: Record<string, any> = {
  plane: Plane,
  shield: Shield,
  car: Car,
  target: Target,
};

// Componente Visual do Círculo de Progresso
const GoalProgressCircle = ({ percentage, color }: { percentage: number; color: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-32 w-32 -rotate-90 transform">
        {/* Círculo de Fundo */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted/20"
        />
        {/* Círculo de Progresso */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Texto Central */}
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

const Metas = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['goals-and-budgets'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = startOfMonth(now).toISOString();
      const lastDay = endOfMonth(now).toISOString();

      const { data: goals } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      const { data: budgets } = await supabase.from('budgets').select('*, categories(*)');
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, category_id, type')
        .eq('type', 'expense')
        .gte('date', firstDay)
        .lte('date', lastDay);

      return { goals, budgets, transactions };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 animate-fade-in">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">Metas & Orçamentos</h1>
            <p className="text-muted-foreground text-base">Gerencie seus sonhos e controle seus limites.</p>
          </div>
          <NewGoalDialog />
        </header>

        {/* SEÇÃO DE METAS */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
               <Target className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Objetivos de Poupança</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.goals?.map((goal) => {
              const target = Number(goal.target_amount);
              const current = Number(goal.current_amount);
              const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
              const IconComponent = goalIcons[goal.icon] || Target;

              return (
                <div 
                  key={goal.id} 
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Gradiente de fundo sutil no hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                    style={{ backgroundColor: goal.color }}
                  />

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                        <h3 className="text-lg font-bold text-foreground truncate max-w-[150px]">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">Meta: {formatCurrency(target)}</p>
                    </div>
                    <div 
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm" 
                        style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <IconComponent className="h-5 w-5" style={{ color: goal.color }} />
                    </div>
                  </div>

                  <div className="flex justify-center mb-6 relative z-10">
                    <GoalProgressCircle percentage={percentage} color={goal.color} />
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Guardado</span>
                        <span className="font-bold text-foreground">{formatCurrency(current)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Falta</span>
                        <span className="font-bold text-foreground">{formatCurrency(Math.max(0, target - current))}</span>
                    </div>
                    
                    <div className="pt-2">
                        <DepositGoalDialog goalId={goal.id} goalName={goal.name} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State das Metas */}
            {data?.goals?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                <Target className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Nenhuma meta criada</h3>
                <p className="text-muted-foreground mb-6">Defina um objetivo para começar a poupar.</p>
                <NewGoalDialog />
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO DE ORÇAMENTOS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-lg">
               <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Limites de Gastos (Mensal)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.budgets?.map((budget) => {
              const spent = data.transactions
                ?.filter(t => t.category_id === budget.category_id)
                .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
              
              const limit = Number(budget.limit_amount);
              const percentage = Math.round((spent / limit) * 100);
              const isOver = percentage > 100;
              const isWarning = percentage > 80 && !isOver;

              return (
                <div key={budget.id} className="rounded-2xl bg-card border border-border/50 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-muted">
                        <CategoryIcon icon={budget.categories?.icon} color={budget.categories?.color} size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">{budget.categories?.name}</h4>
                        <p className="text-xs text-muted-foreground">Limite: {formatCurrency(limit)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(spent)}
                        </span>
                        <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            isOver ? "bg-red-500/10 text-red-500" : 
                            isWarning ? "bg-yellow-500/10 text-yellow-600" : 
                            "bg-green-500/10 text-green-600"
                        )}>
                            {percentage}%
                        </span>
                    </div>

                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", 
                            isOver ? 'bg-red-500' : 
                            isWarning ? 'bg-yellow-500' : 
                            'bg-green-500'
                        )} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    {isOver && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Orçamento estourado em {formatCurrency(spent - limit)}
                        </p>
                    )}
                  </div>
                </div>
              );
            })}

            {data?.budgets?.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">
                  Nenhum orçamento configurado. Configure seus limites na tela de Ajustes.
                </div>
            )}
          </div>
        </section>

      </div>
  
  );
};

export default Metas;