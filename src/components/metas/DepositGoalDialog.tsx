import { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function DepositGoalDialog({ goalId, goalName }: { goalId: string, goalName: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('goal_deposits').insert({
        goal_id: goalId,
        user_id: user.id,
        amount: parseFloat(amount)
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-and-budgets'] });
      toast.success(`R$ ${amount} guardados para ${goalName}!`);
      setOpen(false);
      setAmount('');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full mt-4 gap-2 border-primary/20 hover:bg-primary/10">
          <DollarSign className="h-4 w-4 text-primary" /> Guardar Dinheiro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Guardar em: {goalName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            type="number" 
            placeholder="Quanto deseja guardar?" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg font-bold"
          />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !amount}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Depósito'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}