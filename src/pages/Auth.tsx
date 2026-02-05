import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Novos estados e estados existentes
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Lógica de Cadastro com metadados
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName, // Salva o nome nos metadados do usuário
            },
            // Se necessário redirecionar para uma página específica após confirmar e-mail:
            // emailRedirectTo: `${window.location.origin}/` 
          }
        });

        if (error) throw error;
        
        // Feedback visual importante para verificação de e-mail
        toast.success('Conta criada com sucesso!', {
          description: 'Verifique sua caixa de entrada (e spam) para confirmar o e-mail antes de entrar.',
          duration: 6000,
        });
        
        // Opcional: Limpar formulário ou mudar para tab de login
        setIsSignUp(false);

      } else {
        // Lógica de Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        navigate('/');
      }
    } catch (error: any) {
      // Tratamento de erros comuns
      if (error.message.includes("Por favor verifique sua caixa de entrada e confirma seu e-mail antes de fazer o log-in.")) {
        toast.error("E-mail não confirmado.", {
          description: "Por favor, verifique seu e-mail para ativar sua conta."
        });
      } else {
        toast.error(error.message || 'Erro na autenticação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-muted">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary">Finan.AI</span>
          </div>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? 'Criar nova conta' : 'Entrar no sistema'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Preencha os dados abaixo para começar sua jornada' 
              : 'Digite seus dados para acessar sua conta'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleAuth}>
          <CardContent className="grid gap-4">
            
            {/* Campo de Nome - Só aparece no Cadastro */}
            {isSignUp && (
              <div className="grid gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <Label htmlFor="fullname">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullname" 
                    type="text" 
                    placeholder="Seu nome" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9"
                    required={isSignUp} // Obrigatório apenas se for cadastro
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                )}
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full"
            >
              {isSignUp ? 'Já tenho uma conta' : 'Criar nova conta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;