import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Store, 
  CreditCard, 
  LogOut, 
  Menu, 
  X,
  User,
  MessageCircle,
  Users,
  Bell
} from "lucide-react";
import logotipo from "@/assets/zapcorte-icon.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard"
  },
  {
    id: "services",
    label: "Meus Serviços",
    icon: Scissors,
    href: "/dashboard/services"
  },
  {
    id: "appointments",
    label: "Meus Agendamentos",
    icon: Calendar,
    href: "/dashboard/appointments"
  },
  {
    id: "customers",
    label: "Meus Clientes",
    icon: Users,
    href: "/dashboard/customers"
  },
  {
    id: "barbershop",
    label: "Personalizar Barbearia",
    icon: Store,
    href: "/dashboard/barbershop"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    href: "/dashboard/whatsapp",
    badge: "Novo"
  },
  {
    id: "notifications",
    label: "Notificações",
    icon: Bell,
    href: "/dashboard/notifications"
  },
  {
    id: "plan",
    label: "Plano & Conta",
    icon: CreditCard,
    href: "/dashboard/plan"
  }
];

interface DashboardSidebarProps {
  className?: string;
}

export const DashboardSidebar = ({ className }: DashboardSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0C0C0C] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={logotipo}
            alt="ZapCorte"
            className="h-8 w-auto"
          />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden text-white hover:bg-gray-800"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24C36B]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email || "Usuário"}
            </p>
            <p className="text-xs text-gray-400">Barbeiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover="hover"
            >
              <Link
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#24C36B] text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <motion.div
          variants={itemVariants}
          whileHover="hover"
        >
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-40", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;