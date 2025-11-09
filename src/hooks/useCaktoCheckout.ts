import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CheckoutOptions {
  planType: 'starter' | 'pro';
  userEmail?: string;
  customData?: Record<string, string>;
}

export const useCaktoCheckout = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getCheckoutUrl = useCallback((planType: 'starter' | 'pro', userEmail?: string) => {
    // URLs diretas do Cakto baseadas nos links fornecidos
    const checkoutUrls = {
      starter: import.meta.env.VITE_CAKTO_CHECKOUT_STARTER || 'https://pay.cakto.com.br/3th8tvh',
      pro: import.meta.env.VITE_CAKTO_CHECKOUT_PRO || 'https://pay.cakto.com.br/9jk3ref'
    };

    const baseUrl = checkoutUrls[planType];
    
    // Se temos email do usuário, adicionar como parâmetro
    if (userEmail || user?.email) {
      const email = userEmail || user?.email;
      const params = new URLSearchParams({ 
        email,
        // Adicionar dados do usuário para rastreamento
        user_id: user?.id || '',
        plan: planType
      });
      return `${baseUrl}?${params.toString()}`;
    }

    return baseUrl;
  }, [user]);

  const redirectToCheckout = useCallback((options: CheckoutOptions) => {
    const { planType, userEmail, customData } = options;
    
    try {
      const checkoutUrl = getCheckoutUrl(planType, userEmail);
      
      // Se temos dados customizados, adicionar aos parâmetros
      if (customData && Object.keys(customData).length > 0) {
        const url = new URL(checkoutUrl);
        Object.entries(customData).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
        window.open(url.toString(), '_blank');
      } else {
        window.open(checkoutUrl, '_blank');
      }
      
      // Mostrar toast de confirmação
      toast({
        title: "Redirecionando para pagamento",
        description: `Abrindo checkout do plano ${planType.charAt(0).toUpperCase() + planType.slice(1)}...`,
      });
      
      // Redirecting to checkout
    } catch (error) {
      console.error('❌ Erro ao redirecionar para checkout:', error);
      toast({
        title: "Erro no checkout",
        description: "Não foi possível abrir a página de pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [getCheckoutUrl]);

  const handlePlanSelection = useCallback((planName: string) => {
    // Mapear nomes dos planos para tipos
    const planTypeMap: Record<string, 'starter' | 'pro'> = {
      'Starter': 'starter',
      'Pro': 'pro'
    };

    const planType = planTypeMap[planName];
    
    if (!planType) {
      // Plan type not recognized
      return;
    }

    // Se usuário não está logado, redirecionar para login primeiro
    if (!user) {
      // User not logged in, redirecting to login
      window.location.href = '/login';
      return;
    }

    // Redirecionar para checkout
    redirectToCheckout({
      planType,
      userEmail: user.email,
      customData: {
        user_id: user.id,
        plan_name: planName
      }
    });
  }, [user, redirectToCheckout]);

  return {
    getCheckoutUrl,
    redirectToCheckout,
    handlePlanSelection,
    isUserLoggedIn: !!user
  };
};