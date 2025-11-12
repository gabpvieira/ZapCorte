import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getUserBarbershop, getUserBarbershopServices } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import type { Barbershop, Service } from '@/lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  plan_type: string;
  subscription_status: string;
  last_payment_date: string | null;
  expires_at: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface UseUserDataReturn {
  profile: UserProfile | null;
  barbershop: Barbershop | null;
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserData = (): UseUserDataReturn => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    const withTimeout = async <T,>(promise: Promise<T>, ms = 10000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
      ]) as Promise<T>;
    };

    if (!user) {
      console.log('❌ fetchUserData: Nenhum usuário');
      setProfile(null);
      setBarbershop(null);
      setServices([]);
      setLoading(false);
      return;
    }

    console.log('🚀 fetchUserData: Iniciando para usuário', user.email);
    setLoading(true);
    setError(null);

    try {
      console.log('👤 Buscando profile...');
      console.log('🔄 Buscando dados do usuário:', user.id);

      // Buscar perfil do usuário com retry
      let userProfile = await withTimeout(getUserProfile(user.id));
      
      // Se o perfil não existir, tentar criar
      if (!userProfile) {
        console.log('⚠️ Perfil não encontrado, tentando criar...');
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              plan_type: 'freemium',
              subscription_status: 'inactive'
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Erro ao criar perfil:', createError);
            throw new Error('Não foi possível criar o perfil do usuário');
          }

          userProfile = newProfile;
          console.log('✅ Perfil criado com sucesso:', userProfile);
        } catch (createErr) {
          console.error('💥 Erro ao criar perfil:', createErr);
          // Tentar buscar novamente (pode ter sido criado por outro processo)
          userProfile = await withTimeout(getUserProfile(user.id));
          if (!userProfile) {
            throw new Error('Perfil não encontrado e não foi possível criar');
          }
        }
      }
      
      console.log('✅ Profile encontrado:', userProfile?.email);
      console.log('👤 Perfil encontrado:', userProfile);
      setProfile(userProfile);

      console.log('🏪 Buscando barbershop...');
      // Buscar barbearia do usuário
      const userBarbershop = await withTimeout(getUserBarbershop(user.id));
      console.log('✅ Barbershop:', userBarbershop?.name || 'Não encontrada');
      console.log('🏪 Barbearia encontrada:', userBarbershop);
      setBarbershop(userBarbershop);

      // Buscar serviços da barbearia
      if (userBarbershop) {
        console.log('🔧 Buscando serviços...');
        const barbershopServices = await withTimeout(getUserBarbershopServices(user.id));
        console.log('✅ Serviços encontrados:', barbershopServices?.length || 0);
        console.log('✂️ Serviços encontrados:', barbershopServices);
        setServices(barbershopServices);
      } else {
        setServices([]);
      }
      
      console.log('🎉 fetchUserData: Concluído com sucesso');
    } catch (err) {
      console.error('💥 Error fetching user data:', err);
      console.error('❌ Erro ao buscar dados do usuário:', err);
      const isTimeout = (err as Error).message === 'timeout';
      const errorMessage = isTimeout 
        ? 'Tempo esgotado ao carregar dados do usuário' 
        : (err as Error).message || 'Erro ao carregar dados do usuário';
      setError(errorMessage);
    } finally {
      console.log('🏁 fetchUserData: Finalizando (loading = false)');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 useUserData useEffect:', {
      user: user?.email,
      authLoading,
      localLoading: loading,
    });

    // Quando a autenticação finalizar, sempre executa fetchUserData.
    // Se não houver usuário, o próprio fetchUserData finaliza o loading.
    if (!authLoading) {
      console.log('📊 Auth finalizada, executando fetchUserData...');
      fetchUserData();
    } else {
      console.log('⏳ Aguardando auth:', { hasUser: !!user, authLoading });
    }
  }, [authLoading, fetchUserData]);

  // Fallback: evita loading infinito em casos de rede lenta/erro silencioso
  useEffect(() => {
    if (authLoading) return;
    if (!loading) return;

    const timeout = setTimeout(() => {
      console.warn('⏱️ Timeout ao carregar dados do usuário. Encerrando loading.');
      setError((prev) => prev ?? 'Tempo esgotado ao carregar dados do usuário');
      setLoading(false);
    }, 12000); // Aumentado para 12 segundos

    return () => clearTimeout(timeout);
  }, [authLoading, loading]);

  return {
    profile,
    barbershop,
    services,
    loading,
    error,
    refetch: fetchUserData
  };
};