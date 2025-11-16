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
      setProfile(null);
      setBarbershop(null);
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {

      // Buscar perfil do usuário com retry
      let userProfile = await withTimeout(getUserProfile(user.id));
      
      // Se o perfil não existir, tentar criar
      if (!userProfile) {
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
            throw new Error('Não foi possível criar o perfil do usuário');
          }

          userProfile = newProfile;
        } catch (createErr) {
          // Tentar buscar novamente (pode ter sido criado por outro processo)
          userProfile = await withTimeout(getUserProfile(user.id));
          if (!userProfile) {
            throw new Error('Perfil não encontrado e não foi possível criar');
          }
        }
      }
      
      setProfile(userProfile);

      // Buscar barbearia do usuário
      const userBarbershop = await withTimeout(getUserBarbershop(user.id));
      setBarbershop(userBarbershop);

      // Buscar serviços da barbearia
      if (userBarbershop) {
        const barbershopServices = await withTimeout(getUserBarbershopServices(user.id));
        setServices(barbershopServices);
      } else {
        setServices([]);
      }
    } catch (err) {
      const isTimeout = (err as Error).message === 'timeout';
      const errorMessage = isTimeout 
        ? 'Tempo esgotado ao carregar dados do usuário' 
        : (err as Error).message || 'Erro ao carregar dados do usuário';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    
    // Quando a autenticação finalizar, sempre executa fetchUserData.
    // Se não houver usuário, o próprio fetchUserData finaliza o loading.
    if (!authLoading && mounted) {
      fetchUserData();
    }
    
    return () => {
      mounted = false;
    };
  }, [authLoading, fetchUserData]);

  // Fallback: evita loading infinito em casos de rede lenta/erro silencioso
  useEffect(() => {
    if (authLoading) return;
    if (!loading) return;

    const timeout = setTimeout(() => {
      setError((prev) => prev ?? 'Tempo esgotado ao carregar dados do usuário');
      setLoading(false);
    }, 10000);

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