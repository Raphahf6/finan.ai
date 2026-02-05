import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Loader2, 
  MessageSquare, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Link2 
} from 'lucide-react';

const Integracoes = () => {
  const queryClient = useQueryClient();
  
  // 1. Busca o status da integração atual
  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Tenta buscar integração existente
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // maybeSingle evita erro se não existir nada ainda
      
      if (error) throw error;
      return data;
    },
  });

  // 2. Função para gerar um novo token de conexão
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gera um token simples: CONNECT + 4 números aleatórios
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const token = `CONNECT-${randomCode}`;

      const { data: existing } = await supabase.from('user_integrations').select('id').eq('user_id', user.id).maybeSingle();

      if (existing) {
        // Se já existe registro, atualiza o token
        await supabase.from('user_integrations').update({ connection_token: token }).eq('user_id', user.id);
      } else {
        // Se não existe, cria um novo
        await supabase.from('user_integrations').insert({ user_id: user.id, connection_token: token });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Novo token de conexão gerado!");
    },
    onError: () => {
      toast.error("Erro ao gerar token. Tente novamente.");
    }
  });

  // 3. Função para desconectar (opcional, mas bom ter)
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('user_integrations').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Telegram desconectado com sucesso.");
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copiado para a área de transferência");
  };

  return (
    
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground mb-2">Integrações</h1>
          <p className="text-muted-foreground font-medium">Conecte seu assistente financeiro aos seus apps favoritos.</p>
        </header>

        <div className="grid gap-6">
          {/* CARD DO TELEGRAM */}
          <Card className="border-l-4 border-l-[#229ED9] shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between bg-card">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-6 w-6 text-[#229ED9]" /> Assistente Telegram
                </CardTitle>
                <CardDescription className="max-w-lg">
                  Receba avisos de contas a vencer e registre movimentações enviando mensagens diretamente pelo Telegram.
                </CardDescription>
              </div>
              {data?.telegram_chat_id ? (
                <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" /> Conectado
                </div>
              ) : (
                <div className="bg-muted px-3 py-1 rounded-full text-xs font-bold text-muted-foreground uppercase tracking-wider border border-border">
                  Não conectado
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {!data?.telegram_chat_id ? (
                    <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-border flex flex-col items-center text-center space-y-4">
                      <div className="bg-background p-4 rounded-full shadow-sm ring-1 ring-border">
                        <Smartphone className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-foreground text-lg">Vincular Dispositivo</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Gere um token abaixo e envie para o nosso bot no Telegram para autorizar a conexão.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full max-w-xs">
                        {data?.connection_token ? (
                          <>
                            <div className="relative flex-1">
                              <Input 
                                readOnly 
                                value={data.connection_token} 
                                className="text-center font-mono font-bold text-lg tracking-widest bg-background border-primary/50 text-primary h-12" 
                              />
                            </div>
                            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(data.connection_token)}>
                              <Copy className="h-5 w-5" />
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => generateTokenMutation.mutate()} className="w-full h-12 font-bold" disabled={generateTokenMutation.isPending}>
                            {generateTokenMutation.isPending ? <Loader2 className="animate-spin" /> : 'Gerar Token de Acesso'}
                          </Button>
                        )}
                      </div>
                      
                      {data?.connection_token && (
                        <div className="text-xs text-muted-foreground bg-amber-500/10 text-amber-600 px-3 py-1 rounded-md font-medium">
                          ⚠️ Copie o token e envie <b>/start {data.connection_token}</b> no bot.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-500/5 p-6 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="font-bold text-foreground text-lg">Sincronização Ativa</p>
                           <p className="text-sm text-muted-foreground">ID do Chat: <span className="font-mono">{data.telegram_chat_id}</span></p>
                           <p className="text-xs text-muted-foreground mt-1">Usuário: @{data.telegram_username || 'Desconhecido'}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => {
                          if(confirm("Deseja realmente desconectar?")) disconnectMutation.mutate(data.id);
                        }}
                      >
                        Desconectar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD OPEN FINANCE (PLACEHOLDER) */}
          <Card className="opacity-60 grayscale border-dashed bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-6 w-6" /> Open Finance
              </CardTitle>
              <CardDescription>
                Conexão bancária direta (Itaú, Nubank, XP). Em breve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outline" className="w-full">Indisponível no plano atual</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    
  );
};

export default Integracoes;