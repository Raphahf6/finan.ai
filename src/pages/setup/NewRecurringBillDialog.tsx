import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react'; // Removi CalendarDays se não for usado
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // <--- ADICIONEI useQuery
import { toast } from 'sonner';

export function NewRecurringBillDialog() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [categoryId, setCategoryId] = useState(''); // <--- NOVO ESTADO

  const queryClient = useQueryClient();

  // 1. BUSCAR CATEGORIAS DO BANCO
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Busca categorias para popular o Select
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('recurring_bills').insert({
        user_id: user.id,
        description,
        amount: parseFloat(amount),
        due_day: parseInt(dueDay),
        category_id: categoryId || null, // <--- AQUI: SALVA A CATEGORIA
        type: 'expense'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-data'] });
      // Também invalida o dashboard se tiver query dele
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] }); 
      
      toast.success('Conta recorrente adicionada!');
      setOpen(false);
      setDescription('');
      setAmount('');
      setCategoryId(''); // Limpa a categoria
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
          
          {/* CAMPO DESCRIÇÃO */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input 
              placeholder="Ex: Aluguel, Netflix..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* CAMPO VALOR */}
          <div className="space-y-2">
            <Label>Valor Mensal (R$)</Label>
            <Input 
              type="number" 
              placeholder="0,00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* NOVO CAMPO: CATEGORIA */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
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

          {/* CAMPO DIA VENCIMENTO */}
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

          <Button 
            className="w-full font-bold" 
            onClick={() => mutation.mutate()} 
            // Botão desabilitado se não tiver Descrição, Valor ou Categoria (Opcional)
            disabled={mutation.isPending || !amount || !description}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Conta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}