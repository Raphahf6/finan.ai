import { useState } from 'react';
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
  ExternalLink,
  Trash2,
  AlertTriangle,
  Send,
  Building2,
  Upload,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const Integracoes = () => {
  const queryClient = useQueryClient();
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  
  // 1. Busca o status da integração
  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // 2. Gerar Token (Conexão)
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gera Token curto e legível
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: existing } = await supabase.from('user_integrations').select('id').eq('user_id', user.id).maybeSingle();

      if (existing) {
        await supabase.from('user_integrations').update({ connection_token: token }).eq('user_id', user.id);
      } else {
        await supabase.from('user_integrations').insert({ user_id: user.id, connection_token: token });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Token gerado! Clique para abrir o Telegram.");
    },
    onError: () => toast.error("Erro ao gerar token.")
  });

  // 3. Desconectar (Limpa o chat_id mas mantém o registro)
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('user_integrations')
        .update({ 
            telegram_chat_id: null, 
            telegram_username: null,
            connection_token: null 
        })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsDisconnectOpen(false);
      toast.success("Telegram desconectado com sucesso.");
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`/start ${text}`);
    toast.success("Comando copiado!");
  };

  // URL Deep Link
  const telegramBotUrl = `https://t.me/PlanejadorFinanceiro_bot?start=${data?.connection_token}`;

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      
      <header className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">Central de Integrações</h1>
        <p className="text-muted-foreground font-medium text-lg">
           Conecte seus aplicativos e automatize sua vida financeira.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* === CARD PRINCIPAL: TELEGRAM === */}
        <Card className="lg:col-span-2 border-l-4 border-l-[#229ED9] shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Send className="w-32 h-32 text-[#229ED9]" />
          </div>
          
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-[#229ED9]/10 flex items-center justify-center">
                     <Send className="h-6 w-6 text-[#229ED9]" />
                  </div>
                  <div>
                     <CardTitle className="text-xl font-bold">Bot Telegram</CardTitle>
                     <CardDescription>Lance gastos instantaneamente via chat.</CardDescription>
                  </div>
               </div>
               
               {data?.telegram_chat_id ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                     <CheckCircle2 className="h-4 w-4" /> Ativo
                  </div>
               ) : (
                  <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                     <AlertTriangle className="h-4 w-4" /> Desconectado
                  </div>
               )}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {isLoading ? (
               <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : (
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* LADO ESQUERDO: INFORMAÇÕES */}
                  <div className="flex-1 space-y-4">
                     <div className="space-y-2">
                        <h3 className="font-bold text-lg text-foreground">Como funciona?</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                           <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>Envie gastos como mensagem: <b>"g 50 pizza"</b></span>
                           </li>
                           <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>Receba avisos de contas a vencer toda manhã.</span>
                           </li>
                           <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>Consulte seu saldo com um clique.</span>
                           </li>
                        </ul>
                     </div>
                  </div>

                  {/* LADO DIREITO: AÇÕES */}
                  <div className="w-full md:max-w-sm bg-muted/30 p-6 rounded-2xl border border-border/50">
                     {!data?.telegram_chat_id ? (
                        <div className="space-y-4">
                           <p className="font-bold text-center text-foreground">Conectar Agora</p>
                           
                           {!data?.connection_token ? (
                              <Button 
                                 onClick={() => generateTokenMutation.mutate()} 
                                 className="w-full h-12 font-bold bg-[#229ED9] hover:bg-[#229ED9]/90" 
                                 disabled={generateTokenMutation.isPending}
                              >
                                 {generateTokenMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                 Gerar Link de Conexão
                              </Button>
                           ) : (
                              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                 <Button 
                                    onClick={() => window.open(telegramBotUrl, '_blank')} 
                                    className="w-full h-12 font-bold bg-[#229ED9] hover:bg-[#229ED9]/90 shadow-lg shadow-[#229ED9]/20"
                                 >
                                    Abrir Telegram <ExternalLink className="ml-2 h-4 w-4" />
                                 </Button>
                                 
                                 <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-muted px-2 text-muted-foreground">Ou</span></div>
                                 </div>

                                 <div 
                                    onClick={() => copyToClipboard(data.connection_token)}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:border-primary transition-colors group"
                                 >
                                    <code className="font-mono font-bold text-primary">/start {data.connection_token}</code>
                                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                 </div>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="space-y-4 text-center">
                           <div className="h-16 w-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                              <ShieldCheck className="h-8 w-8" />
                           </div>
                           <div>
                              <p className="font-bold text-foreground">Sincronizado</p>
                              <p className="text-xs text-muted-foreground mt-1">Chat ID: {data.telegram_chat_id}</p>
                              <p className="text-xs text-muted-foreground">Usuário: @{data.telegram_username || '---'}</p>
                           </div>
                           <Button 
                              variant="outline" 
                              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setIsDisconnectOpen(true)}
                           >
                              Desconectar
                           </Button>
                        </div>
                     )}
                  </div>

               </div>
            )}
          </CardContent>
        </Card>

        {/* === CARDS SECUNDÁRIOS === */}
        
        {/* Open Banking */}
        <Card className="opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
           <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Building2 className="h-6 w-6" /></div>
                 <CardTitle>Open Finance</CardTitle>
              </div>
              <CardDescription>
                 Conecte Itaú, Nubank, Bradesco e XP para importar extratos automaticamente.
              </CardDescription>
           </CardHeader>
           <CardContent>
              <Button disabled variant="secondary" className="w-full">
                 Em breve
              </Button>
           </CardContent>
        </Card>

        {/* Importação CSV */}
        <Card>
           <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Upload className="h-6 w-6" /></div>
                 <CardTitle>Importar OFX/CSV</CardTitle>
              </div>
              <CardDescription>
                 Faça upload do extrato do seu banco para preencher a planilha.
              </CardDescription>
           </CardHeader>
           <CardContent>
              <Button variant="outline" className="w-full" onClick={() => toast.info("Disponível na próxima atualização")}>
                 Carregar Arquivo
              </Button>
           </CardContent>
        </Card>

      </div>

      {/* MODAL DE DESCONEXÃO */}
      <Dialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-red-500">
                  <Trash2 className="h-5 w-5" /> Desconectar Telegram?
               </DialogTitle>
               <DialogDescription>
                  Você perderá a capacidade de lançar gastos pelo bot até conectar novamente.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsDisconnectOpen(false)}>Cancelar</Button>
               <Button 
                  variant="destructive" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
               >
                  {disconnectMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Desconexão'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
};

export default Integracoes;