import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, BarChart3, Users, DollarSign, Settings } from 'lucide-react';
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
    if (!loading && !isAdmin && user) {
      // Se tem usuário mas não é admin, redireciona
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
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
                className="border-zinc-800 hover:bg-zinc-900 hover:border-purple-500 transition-all"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-zinc-950/50 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Button
              variant="ghost"
              className={`text-gray-400 hover:text-white hover:bg-zinc-900 rounded-none border-b-2 transition-all ${
                window.location.pathname === '/admin/dashboard'
                  ? 'border-purple-500 text-white bg-zinc-900/50'
                  : 'border-transparent'
              }`}
              onClick={() => navigate('/admin/dashboard')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className={`text-gray-400 hover:text-white hover:bg-zinc-900 rounded-none border-b-2 transition-all ${
                window.location.pathname === '/admin/users'
                  ? 'border-green-500 text-white bg-zinc-900/50'
                  : 'border-transparent'
              }`}
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </Button>
            <Button
              variant="ghost"
              className={`text-gray-400 hover:text-white hover:bg-zinc-900 rounded-none border-b-2 transition-all ${
                window.location.pathname === '/admin/revenue'
                  ? 'border-green-500 text-white bg-zinc-900/50'
                  : 'border-transparent'
              }`}
              onClick={() => navigate('/admin/revenue')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Receita
            </Button>
            <Button
              variant="ghost"
              className={`text-gray-400 hover:text-white hover:bg-zinc-900 rounded-none border-b-2 transition-all ${
                window.location.pathname === '/admin/settings'
                  ? 'border-purple-500 text-white bg-zinc-900/50'
                  : 'border-transparent'
              }`}
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            ZapCorte Admin Panel - Acesso Restrito © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
