import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings, Sparkles, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/setup-financeiro', icon: Calculator, label: 'Setup' }, // Encurtei para "Setup" para caber melhor
  { to: '/integracoes', icon: Sparkles, label: 'Integrar' },     // Encurtei para "Integrar"
  { to: '/extrato', icon: Receipt, label: 'Extrato' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/configuracoes', icon: Settings, label: 'Ajustes' },    // Encurtei para "Ajustes"
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 pb-safe pt-2 z-50">
      <div className="flex items-center justify-between md:justify-center gap-1 overflow-x-auto no-scrollbar w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] py-2 rounded-xl transition-all duration-200 flex-shrink-0', // flex-shrink-0 impede que esmague
                isActive 
                  ? 'text-primary bg-primary/10 font-bold' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "fill-current")} />
              <span className="text-[10px] truncate max-w-full px-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}