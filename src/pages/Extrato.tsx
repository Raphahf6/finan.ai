import { useState, useMemo } from 'react';
import { Search, Calendar, Loader2, Trash2, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Extrato = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['extrato-data'],
    queryFn: async () => {
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .order('date', { ascending: false });

      const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('*');

      if (tError || cError) throw tError || cError;
      return { transactions, categories };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extrato-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Transação removida com sucesso');
    },
    onError: () => toast.error('Erro ao remover transação'),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [data?.transactions, search, typeFilter, categoryFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTransactions.forEach((t) => {
      const dateKey = t.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    
      <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Extrato</h1>
          <p className="text-muted-foreground font-medium">Acompanhe seu histórico financeiro detalhado</p>
        </header>

        {/* Filtros com contraste fixo */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 bg-card/50 p-4 rounded-2xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border text-foreground font-medium"
            />
          </div>
          
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11 bg-background font-semibold text-foreground border-border">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">Todos</SelectItem>
                <SelectItem value="income" className="font-medium text-emerald-600">Receitas</SelectItem>
                <SelectItem value="expense" className="font-medium text-red-600">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 bg-background font-semibold text-foreground border-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">Todas Categorias</SelectItem>
                {data?.categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
                      <span className="font-medium text-foreground">{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="space-y-10">
          {groupedByDate.map(([date, transactions]) => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border group hover:border-primary/40 hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0 shadow-inner"
                      style={{ backgroundColor: `${transaction.categories?.color}15` }}
                    >
                      <CategoryIcon
                        icon={transaction.categories?.icon || 'Circle'}
                        color={transaction.categories?.color}
                        size={20}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {transaction.categories?.name}
                        </span>
                        {transaction.status === 'pending' && (
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <span className={cn(
                        'font-black text-lg tabular-nums',
                        transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        onClick={() => {
                          if(confirm("Deseja realmente apagar esta transação?")) {
                            deleteMutation.mutate(transaction.id);
                          }
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groupedByDate.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-muted rounded-[2rem] bg-card/20">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Nenhum resultado</h3>
              <p className="text-muted-foreground font-medium">Tente ajustar seus filtros ou busca.</p>
            </div>
          )}
        </div>
      </div>
    
  );
};

export default Extrato;