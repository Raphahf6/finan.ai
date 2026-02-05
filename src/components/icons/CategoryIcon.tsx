import {
  Briefcase,
  Laptop,
  TrendingUp,
  PlusCircle,
  Utensils,
  Car,
  Home,
  Heart,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  Plane,
  Shield,
  Target,
  Circle,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  utensils: Utensils,
  car: Car,
  home: Home,
  heart: Heart,
  'book-open': BookOpen,
  'gamepad-2': Gamepad2,
  'shopping-bag': ShoppingBag,
  'credit-card': CreditCard,
  plane: Plane,
  shield: Shield,
  target: Target,
  circle: Circle,
};

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, color, size = 20, className }: CategoryIconProps) {
  const IconComponent = iconMap[icon] || Circle;
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      style={{ color: color || 'currentColor' }}
    />
  );
}
