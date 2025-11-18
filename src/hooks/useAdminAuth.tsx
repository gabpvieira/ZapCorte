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
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        await checkAdminStatus();
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
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
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao buscar usuário:', error);
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (!user) {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verificar se o email é o admin
      if (user.email === ADMIN_EMAIL) {
        // Atualizar último login (não bloqueia a UI)
        supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('email', user.email)
          .then(() => {})
          .catch((err) => console.error('Erro ao atualizar último login:', err));

        setIsAdmin(true);
        setUser(user);
      } else {
        setIsAdmin(false);
        setUser(null);
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
