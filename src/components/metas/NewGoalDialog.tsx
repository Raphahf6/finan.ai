import { useState } from 'react';
import { Plus, Target, Plane, Shield, Car, Loader2, Sparkles } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ICONS = [
  { id: 'target', icon: Target, label: 'Geral' },
  { id: 'plane', icon: Plane, label: 'Viagem' },
  { id: 'car', icon: Car, label: 'Veículo' },
  { id: 'shield', icon: Shield, label: 'Reserva' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export function NewGoalDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount),
        icon: selectedIcon,
        color: selectedColor,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-and-budgets'] });
      toast.success('Meta criada com sucesso!');
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar meta: ' + error.message);
    }
  });

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setSelectedIcon('target');
    setSelectedColor(COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Desktop Button */}
        <Button className="hidden md:flex gap-2">
          <Plus className="h-4 w-4" /> Nova Meta
        </Button>
      </DialogTrigger>
      
      {/* Botão Mobile (FAB) */}
      <div className="md:hidden">
        <button onClick={() => setOpen(true)} className="fab">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novo Objetivo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Objetivo</Label>
            <Input 
              id="name" 
              placeholder="Ex: Viagem para o Japão, Palio 2000..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Valor Alvo (R$)</Label>
              <Input 
                id="target" 
                type="number" 
                placeholder="0.00" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current">Já tenho (R$)</Label>
              <Input 
                id="current" 
                type="number" 
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ícone</Label>
            <div className="flex gap-3">
              {ICONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIcon(item.id)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all",
                      selectedIcon === item.id 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-muted text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    <IconComp className="h-6 w-6" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Cor de destaque</Label>
            <div className="flex gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name || !targetAmount}
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}