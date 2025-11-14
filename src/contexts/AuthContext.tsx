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
    // Obter sessão inicial com persistência reforçada
    const getInitialSession = async () => {
      try {
        // Primeiro, tentar recuperar sessão do localStorage
        const storedSession = localStorage.getItem('supabase.auth.token');
        console.log('🔐 Verificando sessão armazenada:', storedSession ? 'Existe' : 'Não existe');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
        }
        
        if (session?.user) {
          console.log('✅ Sessão válida encontrada:', session.user.email);
          setSession(session);
          setUser(session.user);
          
          // Salvar sessão no localStorage para PWA
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
          
          // Criar ou atualizar perfil se necessário (não bloquear carregamento)
          createOrUpdateProfile(session.user).catch((e) => {
            console.error('Erro ao criar/atualizar perfil:', e);
          });
        } else {
          console.log('❌ Nenhuma sessão válida encontrada');
          setSession(null);
          setUser(null);
          localStorage.removeItem('zapcorte_user_session');
        }
      } catch (error) {
        console.error('💥 Erro ao verificar sessão inicial:', error);
        setSession(null);
        setUser(null);
        localStorage.removeItem('zapcorte_user_session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configurar listener para mudanças de autenticação com persistência
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        // Verificar se o token está próximo do vencimento e fazer refresh automático
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const tenMinutes = 10 * 60 * 1000; // 10 minutos
          
          if (timeUntilExpiry < tenMinutes && timeUntilExpiry > 0) {
            console.log('⏰ Token próximo do vencimento, fazendo refresh...');
            try {
              const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
              if (refreshedSession && !error) {
                console.log('✅ Token renovado com sucesso');
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                
                // Atualizar localStorage
                localStorage.setItem('zapcorte_user_session', JSON.stringify({
                  user_id: refreshedSession.user.id,
                  email: refreshedSession.user.email,
                  expires_at: refreshedSession.expires_at
                }));
                return;
              }
            } catch (error) {
              console.error('❌ Erro ao fazer refresh do token:', error);
            }
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Gerenciar localStorage baseado no evento
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuário logado:', session.user.email);
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
          
          createOrUpdateProfile(session.user).catch((e) => {
            console.error('Erro ao criar/atualizar perfil (SIGNED_IN):', e);
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
          localStorage.removeItem('zapcorte_user_session');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token atualizado');
          localStorage.setItem('zapcorte_user_session', JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            expires_at: session.expires_at
          }));
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
    console.log('👋 Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
    } else {
      console.log('✅ Logout realizado com sucesso');
      localStorage.removeItem('zapcorte_user_session');
      setUser(null);
      setSession(null);
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