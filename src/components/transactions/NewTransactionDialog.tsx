import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Loader2, CalendarIcon, Repeat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Category {
  id: string;
  name: string;
}

interface NewTransactionDialogProps {
  categories: Category[];
  children?: React.ReactNode; // <--- NOVO: Permite passar um botão personalizado
}

export function NewTransactionDialog({ categories, children }: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'expense' | 'income' | 'recurring'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dueDay, setDueDay] = useState('5');

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const numericAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numericAmount)) throw new Error("Valor inválido");

      if (type === 'recurring') {
        const { error } = await supabase.from('recurring_bills').insert({
          user_id: user.id,
          description,
          amount: numericAmount,
          due_day: parseInt(dueDay),
          category_id: categoryId || null,
          type: 'expense'
        });
        if (error) throw error;
      } else {
        const finalAmount = type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount);
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          description,
          amount: finalAmount,
          category_id: categoryId || null,
          date: date ? date.toISOString() : new Date().toISOString(),
          type: type
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success(type === 'recurring' ? 'Conta mensal agendada!' : 'Transação salva!');
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao salvar.');
    }
  });

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date());
    setDueDay('5');
    setType('expense');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* LÓGICA: Se passar um filho (botão redondo), usa ele. Se não, usa o padrão retangular. */}
        {children ? children : (
          <Button className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Transação</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Movimentação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* SELETOR DE TIPO */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setType('expense')}
              className={cn(
                "py-1.5 text-sm font-bold rounded-md transition-all",
                type === 'expense' 
                  ? "bg-background text-red-500 shadow-sm border border-red-100" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Despesa
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                "py-1.5 text-sm font-bold rounded-md transition-all",
                type === 'income' 
                  ? "bg-background text-emerald-500 shadow-sm border border-emerald-100" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Receita
            </button>
            <button
              onClick={() => setType('recurring')}
              className={cn(
                "py-1.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1",
                type === 'recurring' 
                  ? "bg-background text-blue-500 shadow-sm border border-blue-100" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Repeat className="h-3 w-3" /> Fixa
            </button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-bold"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input
                id="desc"
                placeholder={type === 'recurring' ? "Ex: Aluguel..." : "Ex: Mercado..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {type === 'recurring' ? (
              <div className="grid gap-2">
                <Label>Dia do Vencimento</Label>
                <Select value={dueDay} onValueChange={setDueDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>Dia {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy") : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          className={cn(
            "w-full font-bold mt-2",
            type === 'expense' ? "bg-red-600 hover:bg-red-700" :
            type === 'income' ? "bg-emerald-600 hover:bg-emerald-700" :
            "bg-blue-600 hover:bg-blue-700"
          )} 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !amount || !description}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 
           type === 'recurring' ? 'Agendar Conta Mensal' : 'Salvar Transação'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}