import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Dashboard from "./pages/Dashboard";
import Extrato from "./pages/Extrato";
import Metas from "./pages/Metas";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Integracoes from "./pages/Integracoes";
import SetupFinanceiro from "./pages/setup/SetupFinanceiro";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null; // Ou um splash screen

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Se não houver sessão, manda para /auth */}
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            
            {/* Rotas Protegidas */}
            <Route element={<AppLayout />}> 
            <Route path="/" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/extrato" element={session ? <Extrato /> : <Navigate to="/auth" />} />
            <Route path="/metas" element={session ? <Metas /> : <Navigate to="/auth" />} />
            <Route path="/setup-financeiro" element={session ? <SetupFinanceiro /> : <Navigate to="/auth" />} />
            <Route path="/integracoes" element={session ? <Integracoes /> : <Navigate to="/auth" />} />
            <Route path="/configuracoes" element={session ? <Configuracoes /> : <Navigate to="/auth" />} />
            
            <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;