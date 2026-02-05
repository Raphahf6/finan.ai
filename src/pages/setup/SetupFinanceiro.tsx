import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Loader2, 
  Calendar, 
  Trash2, 
  Wallet, 
  PieChart, 
  Save,
  Pencil,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { NewRecurringBillDialog } from './NewRecurringBillDialog';
import { cn } from '@/lib/utils';

const SetupFinanceiro = () => {
  const queryClient = useQueryClient();
  const [income, setIncome] = useState<string>('');
  const [salaryDay, setSalaryDay] = useState<string>('5');
  const [tempBudgets, setTempBudgets] = useState<Record<string, number>>({});
  
  const isInitialLoad = useRef(true);

  // --- DATA FETCHING (Sem Metas) ---
  const { data, isLoading } = useQuery({
    queryKey: ['setup-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const [profileRes, categoriesRes, recurringRes, budgetsRes] = await Promise.all([
        supabase.from('profiles').select('monthly_income, salary_date').eq('id', user.id).single(),
        supabase.from('categories').select('*').eq('type', 'expense').order('name'),
        supabase.from('recurring_bills').select('*'),
        supabase.from('budgets').select('*')
      ]);

      return { 
        profile: profileRes.data, 
        categories: categoriesRes.data, 
        recurring: recurringRes.data, 
        existingBudgets: budgetsRes.data
      };
    },
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (data && isInitialLoad.current) {
      if (data.profile) {
        setIncome(data.profile.monthly_income?.toString() || '');
        setSalaryDay(data.profile.salary_date?.toString() || '5');
      }
      if (data.existingBudgets && data.existingBudgets.length > 0) {
        const initial: Record<string, number> = {};
        data.existingBudgets.forEach((b: any) => {
          initial[b.category_id] = Number(b.limit_amount);
        });
        setTempBudgets(initial);
      }
      isInitialLoad.current = false;
    }
  }, [data]);

  // IA Otimizadora
  useEffect(() => {
    const incomeNum = parseFloat(income);
    const hasBudgets = Object.keys(tempBudgets).length > 0;
    
    if (!isNaN(incomeNum) && incomeNum > 0 && !hasBudgets && !isInitialLoad.current) {
      const sugerido: Record<string, number> = {};
      data?.categories?.forEach((cat: any) => {
        if (['Alimentação', 'Moradia', 'Transporte'].some(k => cat.name.includes(k))) {
          sugerido[cat.id] = (incomeNum * 0.15); 
        } else if (['Lazer', 'Saúde'].some(k => cat.name.includes(k))) {
          sugerido[cat.id] = (incomeNum * 0.10);
        } else {
          sugerido[cat.id] = (incomeNum * 0.05);
        }
      });
      setTempBudgets(sugerido);
      toast.info("Sugestão de orçamento gerada com base na sua renda!", { duration: 2000 });
    }
  }, [income]);

  // --- MUTATIONS ---
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const incomeValue = parseFloat(income) || 0;
      const salaryDateValue = parseInt(salaryDay);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ monthly_income: incomeValue, salary_date: salaryDateValue })
        .eq('id', user.id);
      if (profileError) throw profileError;

      if (Object.keys(tempBudgets).length > 0) {
        await supabase.from('budgets').delete().eq('user_id', user.id);
        const budgetData = Object.entries(tempBudgets).map(([catId, amount]) => ({
          user_id: user.id,
          category_id: catId,
          limit_amount: amount,
        }));
        const { error: budgetError } = await supabase.from('budgets').insert(budgetData);
        if (budgetError) throw budgetError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar configuração.")
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('recurring_bills').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-data'] });
      toast.success("Conta removida.");
    }
  });

  // --- CALCULATIONS ---
  const incomeNum = parseFloat(income) || 0;
  const totalPlanejado = Object.values(tempBudgets).reduce((a, b) => a + b, 0);
  const totalRecorrente = data?.recurring?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0;
  const livreParaInvestir = incomeNum - totalPlanejado;
  const percentualComprometido = incomeNum > 0 ? (totalPlanejado / incomeNum) * 100 : 0;
  
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading && isInitialLoad.current) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto pb-32 animate-fade-in">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings2 className="h-5 w-5 text-primary" />
                 </div>
                 <span className="text-sm font-bold text-primary tracking-wider uppercase">Painel de Controle</span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Setup Financeiro</h1>
              <p className="text-muted-foreground mt-1">Configure suas regras fundamentais.</p>
            </div>

            {/* CARD DE RESUMO FLUTUANTE */}
            <div className="hidden md:flex items-center gap-6 bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Renda Base</p>
                    <p className="text-lg font-bold text-foreground">{formatMoney(incomeNum)}</p>
                </div>
                <div className="h-8 w-[1px] bg-border" />
                <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Fixo Mensal</p>
                    <p className="text-lg font-bold text-orange-500">{formatMoney(totalRecorrente)}</p>
                </div>
                <div className="h-8 w-[1px] bg-border" />
                <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Livre (Teórico)</p>
                    <p className={cn("text-lg font-bold", livreParaInvestir < 0 ? "text-expense" : "text-income")}>
                        {formatMoney(livreParaInvestir)}
                    </p>
                </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* COLUNA ESQUERDA: FUNDAÇÕES */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* 1. RENDA & DATA */}
                <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Wallet className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <Wallet className="h-5 w-5 text-primary" /> 
                             Fonte de Renda
                        </CardTitle>
                        <CardDescription>O combustível do seu sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Renda Mensal Líquida</Label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary group-focus-within:scale-110 transition-transform">R$</span>
                                <Input 
                                    type="number" 
                                    placeholder="0,00"
                                    value={income}
                                    onChange={(e) => setIncome(e.target.value)}
                                    className="pl-10 h-14 text-2xl font-black bg-background border-2 border-transparent focus-visible:border-primary transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Dia do Pagamento</Label>
                            
                            <Select value={salaryDay} onValueChange={setSalaryDay}>
                                <SelectTrigger className="h-12 bg-background border-input font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Selecione o dia" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <SelectItem key={day} value={day.toString()}>
                                            Dia {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                O sistema lançará seu salário automaticamente neste dia.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. RECORRÊNCIAS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" /> Contas Fixas
                            </CardTitle>
                            <CardDescription className="text-xs">Aluguel, Internet, Assinaturas...</CardDescription>
                        </div>
                        <NewRecurringBillDialog />
                    </CardHeader>
                    <CardContent>
                        {data?.recurring?.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-xl border border-dashed text-sm">
                                Nenhuma conta cadastrada.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {data?.recurring?.map((bill: any) => (
                                    <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-background w-10 h-10 rounded-lg flex flex-col items-center justify-center border shadow-sm">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Dia</span>
                                                <span className="text-sm font-black text-foreground">{bill.due_day}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground leading-tight">{bill.description}</p>
                                                <p className="text-xs text-muted-foreground">{formatMoney(Number(bill.amount))}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => deleteBillMutation.mutate(bill.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* COLUNA DIREITA: ORÇAMENTOS APENAS */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* 3. ORÇAMENTOS */}
                <div className="space-y-4">
                    <Card className="border-none shadow-none bg-transparent p-0">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold text-foreground">Limites de Gastos (Mensal)</h2>
                            </div>
                            <span className={cn(
                                "text-sm font-bold px-3 py-1 rounded-full",
                                percentualComprometido > 100 ? "bg-expense/10 text-expense" : "bg-primary/10 text-primary"
                            )}>
                                {percentualComprometido.toFixed(1)}% Comprometido
                            </span>
                        </div>
                        <div className="h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={cn("h-full transition-all duration-700 ease-out", percentualComprometido > 100 ? "bg-expense" : "bg-primary")}
                                style={{ width: `${Math.min(percentualComprometido, 100)}%` }}
                            />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data?.categories?.map((cat: any) => {
                            const amount = tempBudgets[cat.id] || 0;
                            const percentOfIncome = incomeNum > 0 ? (amount / incomeNum) * 100 : 0;
                            
                            return (
                                <div key={cat.id} className="group relative bg-card border border-border p-4 rounded-2xl hover:shadow-md hover:border-primary/30 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                                <CategoryIcon icon={cat.icon} color={cat.color} size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{cat.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                    {percentOfIncome.toFixed(1)}% da Renda
                                                </p>
                                            </div>
                                        </div>
                                        {amount > 0 && (
                                            <div className="bg-primary/5 text-primary px-2 py-1 rounded-lg">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <label className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</label>
                                        <Input 
                                            type="number"
                                            value={amount || ''}
                                            placeholder="0"
                                            onChange={(e) => setTempBudgets({ ...tempBudgets, [cat.id]: parseFloat(e.target.value) || 0 })}
                                            className="pl-8 h-10 font-bold bg-muted/20 border-transparent focus-visible:bg-background focus-visible:border-primary"
                                        />
                                        <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>

      {/* FAB SAVE BUTTON */}
      <div className="fixed bottom-24 md:bottom-12 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <Button 
              onClick={() => saveAllMutation.mutate()} 
              disabled={saveAllMutation.isPending}
              size="lg"
              className={cn(
                  "h-14 px-6 rounded-full shadow-2xl transition-all duration-300 gap-2 text-sm font-black bg-primary hover:bg-primary/90 hover:scale-105",
                  saveAllMutation.isPending && "w-14 px-0"
              )}
          >
              {saveAllMutation.isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                  <>
                      <Save className="h-5 w-5" />
                      SALVAR SETUP
                  </>
              )}
          </Button>
      </div>
    </div>
  );
};

export default SetupFinanceiro;