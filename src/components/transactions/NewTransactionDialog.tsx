import { useState } from 'react';
import { Plus, CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Category } from '@/types/finance';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NewTransactionDialogProps {
  categories: Category[];
}

export function NewTransactionDialog({ categories }: NewTransactionDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');

  const filteredCategories = categories.filter((c) => c.type === type);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        toast.error("Sessão expirada. Faça login novamente.");
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        description: description,
        date: format(date, 'yyyy-MM-dd'),
        type: type,
        category_id: categoryId || null,
        status: status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['extrato-data'] });
      toast.success('Transação adicionada com sucesso!');
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error('Erro ao salvar a transação.');
    }
  });

  const handleSubmit = () => {
    if (!amount || !description || !categoryId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    mutation.mutate();
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date());
    setCategoryId('');
    setStatus('paid');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fab">
          <Plus className="h-6 w-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">Nova Transação</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-0 space-y-5">
          {/* Seletor de Tipo com alto contraste */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            <button
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-bold transition-all',
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              Despesa
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-bold transition-all',
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              Receita
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold h-12 focus-visible:ring-primary border-muted-foreground/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 border-muted-foreground/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-11 border-muted-foreground/20"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-11 border-muted-foreground/20">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} color={category.color} size={16} />
                      <span className="font-medium text-foreground">{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'paid' | 'pending')}>
              <SelectTrigger className="h-11 border-muted-foreground/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid" className="text-foreground font-medium">Pago</SelectItem>
                <SelectItem value="pending" className="text-foreground font-medium">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className={cn(
              'w-full h-12 text-base font-bold transition-all active:scale-[0.98]',
              type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Salvar Transação'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}