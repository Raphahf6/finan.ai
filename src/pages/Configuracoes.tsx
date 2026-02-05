import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Smartphone,
  Building2,
  Sparkles,
  ChevronRight,
  Check,
  X,
  Upload,
  LogOut,
  Send, // Ícone para o Telegram
  Copy,
  Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// --- COMPONENTES REUTILIZÁVEIS ---

interface SettingItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

function SettingItem({ icon: Icon, title, description, children, onClick }: SettingItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl transition-colors',
        onClick ? 'cursor-pointer hover:bg-accent/50' : ''
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {children || <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </div>
  );
}

interface IntegrationCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: 'connected' | 'disconnected' | 'coming-soon';
  color: string;
  onClick?: () => void;
}

function IntegrationCard({ icon: Icon, title, description, status, color, onClick }: IntegrationCardProps) {
  return (
    <div 
      className={cn(
        "rounded-xl bg-card border border-border p-4 transition-all",
        onClick && "cursor-pointer hover:border-primary/50 hover:bg-accent/5"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground">{title}</h4>
            {status === 'connected' && (
              <span className="flex items-center gap-1 text-xs text-income bg-income/10 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" />
                Conectado
              </span>
            )}
            {status === 'disconnected' && (
              <span className="flex items-center gap-1 text-xs text-expense bg-expense/10 px-2 py-0.5 rounded-full">
                <X className="h-3 w-3" />
                Desconectado
              </span>
            )}
            {status === 'coming-soon' && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Em breve
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {status !== 'coming-soon' && (
           <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
        )}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---

const Configuracoes = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Estados para o Modal do Telegram
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Busca usuário
  const { data: user } = useQuery({
    queryKey: ['user-session'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Busca status da integração
  const { data: integrationStatus, refetch: refetchIntegration } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: async () => {
      const { data } = await supabase.from('user_integrations').select('telegram_chat_id').single();
      return data?.telegram_chat_id ? 'connected' : 'disconnected';
    }
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erro ao sair da conta.");
    else toast.success("Você saiu com sucesso!");
  };

  // Lógica para Gerar Token do Bot
  const handleConnectTelegram = async () => {
    if (integrationStatus === 'connected') {
        toast.info("Você já está conectado! Para desconectar, bloqueie o bot no Telegram.");
        return;
    }

    setIsTelegramOpen(true);
    setLoadingToken(true);
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        // 1. Gera um token aleatório único
        const token = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
        
        // 2. Salva no banco (ou atualiza se já existir registro)
        const { error } = await supabase.from('user_integrations').upsert({
            user_id: user.id,
            connection_token: token,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if(error) throw error;

        setTelegramToken(token);
    } catch (err) {
        toast.error("Erro ao gerar token de conexão");
        setIsTelegramOpen(false);
    } finally {
        setLoadingToken(false);
    }
  };

  const copyToken = () => {
    if(telegramToken) {
        navigator.clipboard.writeText(`/start ${telegramToken}`);
        toast.success("Comando copiado!");
    }
  };

  return (
   
      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-20">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </header>

        {/* Premium Banner */}
        <div className="rounded-2xl gradient-premium p-6 mb-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary-foreground mb-1">
                Seja Premium
              </h3>
              <p className="text-primary-foreground/80 mb-4">
                Desbloqueie recursos avançados de IA e relatórios ilimitados.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0">
                  Plano Mensal - R$ 19,90
                </Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Vitalício - R$ 297
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <section className="rounded-2xl bg-card border border-border p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-2 text-center sm:text-left">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {user?.user_metadata?.full_name || 'Usuário'}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </section>

        {/* Settings List */}
        <section className="rounded-2xl bg-card border border-border mb-4">
          <SettingItem
            icon={Bell}
            title="Notificações"
            description="Alertas de orçamento e vencimentos"
          >
            <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled}
            />
          </SettingItem>
          <Separator className="mx-4" />
          <SettingItem
            icon={Shield}
            title="Segurança"
            description="Senha e autenticação em dois fatores"
            onClick={() => toast.info("Em breve: Autenticação de dois fatores.")}
          />
          <Separator className="mx-4" />
          <SettingItem
            icon={CreditCard}
            title="Assinatura e Pagamento"
            description="Gerenciar seu plano Premium"
            onClick={() => toast.info("Gerenciamento de assinatura em desenvolvimento.")}
          />
        </section>

        {/* Integrations Section */}
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Integrações
          </h2>
          <div className="space-y-3">
            
            {/* CARD DO TELEGRAM (AGORA FUNCIONAL) */}
            <IntegrationCard
              icon={Send}
              title="Bot Telegram (Tanque de Guerra)"
              description="Registre gastos e consulte saldo direto pelo chat."
              status={integrationStatus || 'disconnected'}
              color="#229ED9"
              onClick={handleConnectTelegram}
            />

            <IntegrationCard
              icon={Building2}
              title="Open Banking"
              description="Importe transações automaticamente do seu banco"
              status="coming-soon"
              color="#6366f1"
            />
            
            <IntegrationCard
              icon={Upload}
              title="Importar CSV"
              description="Faça upload de extratos bancários"
              status="disconnected"
              color="#f97316"
              onClick={() => toast.info("Importação via CSV será habilitada na próxima versão.")}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl bg-card border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">
            Zona de Perigo
          </h2>
          <Button variant="ghost" className="w-full justify-start text-expense hover:bg-expense/10 hover:text-expense">
            Excluir minha conta
          </Button>
        </section>

        {/* DIALOG DE CONEXÃO TELEGRAM */}
        <Dialog open={isTelegramOpen} onOpenChange={setIsTelegramOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-[#229ED9]" />
                        Conectar Telegram
                    </DialogTitle>
                    <DialogDescription>
                        Siga os passos abaixo para ativar seu assistente financeiro.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loadingToken ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">1. Copie o comando abaixo:</p>
                                <div 
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg border cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={copyToken}
                                >
                                    <code className="text-primary font-mono font-bold text-lg">
                                        /start {telegramToken}
                                    </code>
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-sm font-medium">2. Abra o bot e cole o comando:</p>
                                <Button 
                                    className="w-full bg-[#229ED9] hover:bg-[#229ED9]/90" 
                                    onClick={() => window.open('https://t.me/SEU_BOT_USER_NAME', '_blank')}
                                >
                                    Abrir Telegram
                                </Button>
                                <p className="text-xs text-muted-foreground text-center pt-2">
                                    Após enviar o comando, a conexão será confirmada automaticamente.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>

      </div>
   
  );
};

export default Configuracoes;