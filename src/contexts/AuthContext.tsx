import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Criar ou atualizar perfil se necessário (não bloquear carregamento)
          createOrUpdateProfile(session.user).catch((e) => {
            console.error('Erro ao criar/atualizar perfil:', e);
          });
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão inicial:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Verificar se o token está próximo do vencimento
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000; // Converter para milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const fiveMinutes = 5 * 60 * 1000; // 5 minutos em milliseconds
          
          if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
            try {
              const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
              if (refreshedSession && !error) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                return;
              }
            } catch (error) {
              console.error('Erro ao fazer refresh do token:', error);
            }
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Não bloquear mudanças de auth; processar perfil em background
          createOrUpdateProfile(session.user).catch((e) => {
            console.error('Erro ao criar/atualizar perfil (SIGNED_IN):', e);
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      console.log('🔍 Verificando perfil existente para usuário:', user.id);
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('📋 Perfil existente:', existingProfile);

      if (!existingProfile) {
        console.log('➕ Criando novo perfil...');
        // Criar novo perfil
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            plan_type: 'freemium',
            subscription_status: 'inactive'
          });

        if (error) {
          console.error('❌ Erro ao criar perfil:', error);
        } else {
          console.log('✅ Perfil criado com sucesso!');
        }
      } else {
        console.log('✅ Perfil já existe, não é necessário criar');
      }
    } catch (error) {
      console.error('💥 Erro ao gerenciar perfil:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
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