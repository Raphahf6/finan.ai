import { useState } from 'react';
import { Plus, Loader2, CalendarDays } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function NewRecurringBillDialog() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('recurring_bills').insert({
        user_id: user.id,
        description,
        amount: parseFloat(amount),
        due_day: parseInt(dueDay),
        type: 'expense'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-data'] });
      toast.success('Conta recorrente adicionada!');
      setOpen(false);
      setDescription('');
      setAmount('');
    },
    onError: () => toast.error('Erro ao adicionar conta')
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Nova Conta Fixa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input 
              placeholder="Ex: Aluguel, Netflix..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor Mensal (R$)</Label>
            <Input 
              type="number" 
              placeholder="0,00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Dia do Vencimento</Label>
            <Select value={dueDay} onValueChange={setDueDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>Dia {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full font-bold" onClick={() => mutation.mutate()} disabled={mutation.isPending || !amount || !description}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Conta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}