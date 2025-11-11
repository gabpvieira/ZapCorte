import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CheckoutOptions {
  planType: 'starter' | 'pro';
  userEmail?: string;
  userName?: string;
  customData?: Record<string, string>;
}

interface UserCheckoutData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const useCaktoCheckout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Busca dados completos do usuário logado para pré-preencher o checkout
   */
  const getUserCheckoutData = useCallback(async (): Promise<UserCheckoutData | null> => {
    if (!user) return null;

    try {
      // Buscar dados do perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.warn('⚠️ Erro ao buscar dados do perfil:', error);
      }

      return {
        userId: user.id,
        email: user.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        phone: profile?.phone || ''
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      return {
        userId: user.id,
        email: user.email || ''
      };
    }
  }, [user]);

  /**
   * Gera URL de checkout com dados do usuário pré-preenchidos
   */
  const getCheckoutUrl = useCallback(async (
    planType: 'starter' | 'pro',
    userData?: UserCheckoutData
  ): Promise<string> => {
    // URLs diretas do Cakto baseadas nos links fornecidos
    const checkoutUrls = {
      starter: import.meta.env.VITE_CAKTO_CHECKOUT_STARTER || 'https://pay.cakto.com.br/3th8tvh',
      pro: import.meta.env.VITE_CAKTO_CHECKOUT_PRO || 'https://pay.cakto.com.br/9jk3ref'
    };

    const baseUrl = checkoutUrls[planType];
    
    // Se não temos dados do usuário, buscar
    const checkoutData = userData || await getUserCheckoutData();
    
    if (!checkoutData) {
      return baseUrl;
    }

    // Construir URL com parâmetros de pré-preenchimento
    const url = new URL(baseUrl);
    const params = url.searchParams;

    // Adicionar dados do usuário para pré-preenchimento
    params.set('email', checkoutData.email);
    params.set('user_id', checkoutData.userId);
    params.set('plan', planType);
    
    if (checkoutData.firstName) {
      params.set('first_name', checkoutData.firstName);
    }
    
    if (checkoutData.lastName) {
      params.set('last_name', checkoutData.lastName);
    }
    
    if (checkoutData.phone) {
      params.set('phone', checkoutData.phone);
    }

    // Adicionar timestamp para rastreamento
    params.set('timestamp', new Date().toISOString());

    return url.toString();
  }, [getUserCheckoutData]);

  /**
   * Redireciona para checkout com loading state
   */
  const redirectToCheckout = useCallback(async (options: CheckoutOptions) => {
    const { planType, customData } = options;
    
    // Verificar se usuário está logado
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para fazer upgrade do plano.",
        variant: "destructive",
      });
      window.location.href = '/login';
      return;
    }

    try {
      setIsLoading(true);

      // Buscar dados do usuário
      const userData = await getUserCheckoutData();
      
      if (!userData) {
        throw new Error('Não foi possível obter dados do usuário');
      }

      // Gerar URL de checkout
      let checkoutUrl = await getCheckoutUrl(planType, userData);
      
      // Adicionar dados customizados se fornecidos
      if (customData && Object.keys(customData).length > 0) {
        const url = new URL(checkoutUrl);
        Object.entries(customData).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
        checkoutUrl = url.toString();
      }
      
      // Detectar se é mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // No mobile, usar location.href para evitar bloqueio de popup
      // No desktop, usar window.open para abrir em nova aba
      if (isMobile) {
        window.location.href = checkoutUrl;
      } else {
        window.open(checkoutUrl, '_blank');
      }
      
      // Feedback visual de sucesso
      toast({
        title: "Redirecionando para pagamento",
        description: `Abrindo checkout do plano ${planType === 'starter' ? 'Starter' : 'Pro'}...`,
      });

      console.log('✅ Redirecionamento para checkout realizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao redirecionar para checkout:', error);
      toast({
        title: "Erro no checkout",
        description: "Não foi possível abrir a página de pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, getUserCheckoutData, getCheckoutUrl, toast]);

  /**
   * Handler simplificado para seleção de plano
   */
  const handleUpgrade = useCallback(async (planType: 'starter' | 'pro') => {
    await redirectToCheckout({ planType });
  }, [redirectToCheckout]);

  return {
    getCheckoutUrl,
    redirectToCheckout,
    handleUpgrade,
    isLoading,
    isUserLoggedIn: !!user
  };
};