import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'eugabrieldpv@gmail.com';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await checkAdminStatus();
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setUser(null);
          navigate('/admin/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verificar se o email é o admin
      if (user.email === ADMIN_EMAIL) {
        // Atualizar último login
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('email', user.email);

        setIsAdmin(true);
        setUser(user);
      } else {
        setIsAdmin(false);
        setUser(null);
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para acessar esta área.',
          variant: 'destructive',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao verificar status admin:', error);
      setIsAdmin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (email !== ADMIN_EMAIL) {
        toast({
          title: 'Acesso Negado',
          description: 'Email não autorizado.',
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await checkAdminStatus();
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setUser(null);
      navigate('/admin/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    isAdmin,
    loading,
    user,
    signIn,
    signOut,
  };
}
