import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Obter sessão inicial com persistência reforçada
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setSession(null);
          setUser(null);
          localStorage.removeItem('zapcorte_user_session');
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
          
          // Não bloquear a renderização esperando o profile
          createOrUpdateProfile(session.user).catch(() => {});
        } else {
          setSession(null);
          setUser(null);
          localStorage.removeItem('zapcorte_user_session');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          localStorage.removeItem('zapcorte_user_session');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação com persistência
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Verificar se o token está próximo do vencimento e fazer refresh automático
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const tenMinutes = 10 * 60 * 1000;
          
          if (timeUntilExpiry < tenMinutes && timeUntilExpiry > 0) {
            try {
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (refreshedSession && mounted) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                
                localStorage.setItem('zapcorte_user_session', JSON.stringify({
                  user_id: refreshedSession.user.id,
                  email: refreshedSession.user.email,
                  expires_at: refreshedSession.expires_at
                }));
                return;
              }
            } catch (error) {
              console.error('Erro ao atualizar token:', error);
            }
          }
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Gerenciar localStorage baseado no evento
        if (event === 'SIGNED_IN' && session?.user) {
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
          
          createOrUpdateProfile(session.user).catch(() => {});
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('zapcorte_user_session');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            plan_type: 'freemium',
            subscription_status: 'inactive'
          });
      }
    } catch {}
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('zapcorte_user_session');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};