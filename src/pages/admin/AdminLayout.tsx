import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, BarChart3, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
  const { isAdmin, loading, user, signOut } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ZapCorte Admin</h1>
                <p className="text-xs text-gray-400">{title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-gray-400">Administrador</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-slate-700 hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-slate-800 rounded-none border-b-2 border-transparent data-[active=true]:border-purple-500 data-[active=true]:text-white"
              data-active={window.location.pathname === '/admin/dashboard'}
              onClick={() => navigate('/admin/dashboard')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-slate-800 rounded-none border-b-2 border-transparent"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </Button>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-slate-800 rounded-none border-b-2 border-transparent"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Receita
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            ZapCorte Admin Panel - Acesso Restrito © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
