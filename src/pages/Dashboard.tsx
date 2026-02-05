import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Loader2,
  CalendarClock,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  AlertCircle,
  Plus // Importado para o botão flutuante
} from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewTransactionDialog } from '@/components/transactions/NewTransactionDialog';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = startOfMonth(now).toISOString();
      const lastDay = endOfMonth(now).toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      const [profileRes, transRes, recurringRes, categoriesRes, budgetsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('transactions').select('*, categories(*)').gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }),
        supabase.from('recurring_bills').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('budgets').select('*, categories(*)')
      ]);

      return { 
        profile: profileRes.data, 
        transactions: transRes.data || [], 
        recurring: recurringRes.data || [],
        categories: categoriesRes.data || [],
        budgets: budgetsRes.data || []
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
    </div>
  );

  // --- CÁLCULOS PRINCIPAIS (Com correções de valores negativos) ---
  
  // 1. Totais do Mês
  const salary = Number(data?.profile?.monthly_income || 0);
  
  const expensesMade = data?.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 0;

  const incomesMade = data?.transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
  const totalRecurring = data?.recurring?.reduce((acc, r) => acc + Math.abs(Number(r.amount)), 0) || 0;
  
  // Saldo Previsto (Salário + Extras - Gastos Variáveis - Gastos Fixos)
  const predictedBalance = (salary + incomesMade) - expensesMade - totalRecurring;
  const balanceHealth = predictedBalance >= 0 ? 'healthy' : 'danger';

  // 2. Cálculo de Orçamentos (Soma Variável + Fixa na categoria)
  const budgetStatus = data?.budgets?.map(budget => {
    
    // A. Soma Transações
    const variableSpent = data.transactions
      .filter(t => t.category_id === budget.category_id && t.type === 'expense')
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    // B. Soma Recorrentes
    const fixedSpent = data.recurring
      .filter(r => r.category_id === budget.category_id)
      .reduce((acc, r) => acc + Math.abs(Number(r.amount)), 0);

    const totalSpentInCategory = variableSpent + fixedSpent;
    const limit = Number(budget.limit_amount);
    const percentage = limit > 0 ? (totalSpentInCategory / limit) * 100 : 0;
    
    return {
      ...budget,
      spent: totalSpentInCategory,
      percentage,
      status: percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'ok'
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // 3. Últimas Transações
  const recentTransactions = data?.transactions?.slice(0, 5) || [];

  return (

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-24 space-y-8 animate-fade-in relative">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Olá, {data?.profile?.full_name?.split(' ')[0] || 'Raphael'}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Resumo de {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          {/* Botão Desktop (Opcional, se quiser manter) */}
          <div className="hidden md:block">
             <NewTransactionDialog categories={data?.categories || []} />
          </div>
        </header>

        {/* --- CARDS DE RESUMO (KPIs) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receitas */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Entradas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {formatCurrency(salary + incomesMade)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Salário + Rendas Extras
              </p>
            </CardContent>
          </Card>

          {/* Despesas */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-red-500/10 to-transparent border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Saídas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {/* Total consolidado: Variáveis + Fixas */}
                {formatCurrency(expensesMade + totalRecurring)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Variáveis ({formatCurrency(expensesMade)}) + Fixas ({formatCurrency(totalRecurring)})
              </p>
            </CardContent>
          </Card>

          {/* Saldo Projetado */}
          <Card className={cn(
            "border-none shadow-md border-l-4 transition-colors",
            balanceHealth === 'healthy' 
              ? "bg-primary text-primary-foreground border-l-white/20" 
              : "bg-red-600 text-white border-l-white/20"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 opacity-90">
                <Wallet className="h-4 w-4" /> Previsão de Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">
                {formatCurrency(predictedBalance)}
              </div>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {balanceHealth === 'healthy' 
                  ? "Você está no azul! 🚀" 
                  : "Atenção! Risco de saldo negativo. 🚨"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA (2/3): ORÇAMENTOS E TRANSAÇÕES */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SEÇÃO: MEUS ORÇAMENTOS */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    Controle de Orçamento
                  </CardTitle>
                  <CardDescription>Inclui gastos lançados e contas fixas mensais.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {budgetStatus?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    Você ainda não definiu limites. Vá em <b>Setup Financeiro</b> para configurar.
                  </div>
                ) : (
                  budgetStatus?.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                           <div className={cn("p-1.5 rounded-lg", item.status === 'exceeded' ? "bg-red-100 text-red-600" : "bg-muted")}>
                              <CategoryIcon icon={item.categories?.icon} color={item.status === 'exceeded' ? '#ef4444' : item.categories?.color} size={16} />
                           </div>
                           <span className="font-bold text-foreground">{item.categories?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "font-medium",
                             item.status === 'exceeded' ? "text-red-600" : 
                             item.status === 'warning' ? "text-amber-600" : "text-muted-foreground"
                           )}>
                             {formatCurrency(item.spent)}
                           </span>
                           <span className="text-muted-foreground text-xs">/ {formatCurrency(Number(item.limit_amount))}</span>
                        </div>
                      </div>
                      
                      <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                           className={cn(
                             "h-full transition-all duration-1000 ease-out rounded-full",
                             item.status === 'exceeded' ? "bg-red-500" : 
                             item.status === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                           )}
                           style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      
                      {item.status === 'exceeded' && (
                        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                           <AlertCircle className="h-3 w-3" /> Limite estourado em {formatCurrency(item.spent - Number(item.limit_amount))}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SEÇÃO: ÚLTIMAS TRANSAÇÕES */}
            <Card className="border-border/50 shadow-sm">
               <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                     <ArrowUpRight className="h-5 w-5 text-primary" />
                     Atividade Recente
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Ver Extrato Completo</Button>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {recentTransactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                 "h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                                 t.type === 'expense' ? "bg-red-50 border-red-100 text-red-500" : "bg-emerald-50 border-emerald-100 text-emerald-500"
                              )}>
                                 {t.type === 'expense' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                              </div>
                              <div>
                                 <p className="font-bold text-sm text-foreground">{t.description}</p>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(t.date), "dd 'de' MMM")}</span>
                                    <span>•</span>
                                    <span className="capitalize">{t.categories?.name || 'Geral'}</span>
                                 </div>
                              </div>
                           </div>
                           <span className={cn(
                              "font-bold tabular-nums text-sm",
                              t.type === 'expense' ? "text-foreground" : "text-emerald-600"
                           )}>
                              {t.type === 'expense' ? '-' : '+'} {formatCurrency(Math.abs(Number(t.amount)))}
                           </span>
                        </div>
                     ))}
                     {recentTransactions.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                           Nenhuma movimentação este mês.
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>

          </div>

          {/* COLUNA DIREITA (1/3): CONTAS FIXAS & INSIGHTS */}
          <div className="lg:col-span-1 space-y-8">
             
             {/* PRÓXIMAS CONTAS */}
             <Card className="bg-muted/30 border-none shadow-none">
                <CardHeader>
                   <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" /> Próximos Boletos
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   {data?.recurring?.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Nenhuma conta mensal.</p>
                   ) : (
                      data?.recurring?.sort((a, b) => a.due_day - b.due_day).map((bill) => {
                         const today = new Date().getDate();
                         const isLate = today > bill.due_day;
                         
                         return (
                            <div key={bill.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border shadow-sm">
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                     "flex flex-col items-center justify-center w-10 h-10 rounded-lg border",
                                     isLate ? "bg-red-50 border-red-100 text-red-600" : "bg-muted border-muted-foreground/20 text-foreground"
                                  )}>
                                     <span className="text-[8px] font-black uppercase">DIA</span>
                                     <span className="text-sm font-bold leading-none">{bill.due_day}</span>
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="font-bold text-sm text-foreground">{bill.description}</span>
                                     {isLate && <span className="text-[10px] text-red-500 font-bold uppercase">Atrasado?</span>}
                                  </div>
                               </div>
                               <span className="font-bold text-sm text-muted-foreground">{formatCurrency(Number(bill.amount))}</span>
                            </div>
                         )
                      })
                   )}
                </CardContent>
             </Card>

             {/* RESUMO POR CATEGORIA (Mini-Gráfico) */}
             <Card>
                <CardHeader>
                   <CardTitle className="text-sm font-bold">Top Gastos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {data?.categories
                      ?.map(cat => {
                        // Soma Transações + Recorrentes para o gráfico lateral também
                        const variableSpent = data.transactions
                            .filter(t => t.category_id === cat.id && t.type === 'expense')
                            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
                        
                        const fixedSpent = data.recurring
                            .filter(r => r.category_id === cat.id)
                            .reduce((acc, r) => acc + Math.abs(Number(r.amount)), 0);

                        return {
                            ...cat,
                            total: variableSpent + fixedSpent
                        };
                      })
                      .filter(c => c.total > 0)
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 4)
                      .map((cat) => (
                         <div key={cat.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                               <span className="font-medium text-muted-foreground">{cat.name}</span>
                               <span className="font-bold text-foreground">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                               <div 
                                  className="h-full rounded-full" 
                                  // Denominador ajustado para ser o total real
                                  style={{ width: `${(cat.total / (expensesMade + totalRecurring)) * 100}%`, backgroundColor: cat.color }} 
                               />
                            </div>
                         </div>
                      ))}
                      {(expensesMade + totalRecurring) === 0 && <p className="text-xs text-muted-foreground">Sem dados ainda.</p>}
                </CardContent>
             </Card>

          </div>
        </div>

        {/* --- BOTÃO FLUTUANTE (FAB) --- */}
        <div className="fixed bottom-8 right-6 z-50">
           {/* Usa o componente Novo que aceita filhos */}
           <NewTransactionDialog categories={data?.categories || []}>
              <Button 
                size="icon" 
                className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center"
              >
                <Plus className="h-8 w-8 text-white" />
              </Button>
           </NewTransactionDialog>
        </div>

      </div>
    
  );
};

export default Dashboard;