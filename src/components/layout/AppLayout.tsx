import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop (Fixa) */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
         <AppSidebar />
      </div>

      {/* Conteúdo Principal (Muda conforme a rota) */}
      <main className="flex-1 md:pl-64 w-full relative">
        <Outlet /> {/* <--- AQUI É ONDE AS PÁGINAS VÃO ENTRAR */}
      </main>

      {/* Menu Mobile */}
      <BottomNav />
    </div>
  );
}