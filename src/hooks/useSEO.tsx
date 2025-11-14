import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  type?: string;
}

export const useSEO = ({ title, description, image, type = 'website' }: SEOConfig) => {
  const location = useLocation();

  useEffect(() => {
    // Atualizar título
    document.title = title;

    // Atualizar meta tags
    const updateMeta = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    // Meta description
    updateMeta('meta[name="description"]', description);

    // Open Graph
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:type"]', type);
    updateMeta('meta[property="og:url"]', `https://zapcorte.com${location.pathname}`);
    
    if (image) {
      updateMeta('meta[property="og:image"]', image);
      updateMeta('meta[name="twitter:image"]', image);
    }

    // Twitter Card
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);

  }, [title, description, image, type, location.pathname]);
};

// Configurações de SEO pré-definidas para cada página
export const SEO_CONFIGS = {
  home: {
    title: 'ZapCorte - Sua Barbearia Organizada, No Seu Ritmo.',
    description: 'Sua Barbearia Organizada, No Seu Ritmo. Sistema completo: minisite personalizado, agendamentos online e lembretes automáticos via WhatsApp. Comece grátis!',
  },
  login: {
    title: 'Login - ZapCorte',
    description: 'Acesse sua conta ZapCorte e gerencie os agendamentos da sua barbearia.',
  },
  register: {
    title: 'Criar Conta - ZapCorte',
    description: 'Crie sua conta grátis no ZapCorte e comece a receber agendamentos online hoje mesmo.',
  },
  dashboard: {
    title: 'Dashboard - ZapCorte',
    description: 'Painel de controle da sua barbearia. Visualize estatísticas e gerencie seu negócio.',
  },
  appointments: {
    title: 'Meus Agendamentos - ZapCorte',
    description: 'Gerencie todos os agendamentos da sua barbearia em um só lugar.',
  },
  services: {
    title: 'Meus Serviços - ZapCorte',
    description: 'Configure os serviços oferecidos pela sua barbearia e seus preços.',
  },
  customers: {
    title: 'Meus Clientes - ZapCorte',
    description: 'Gerencie sua base de clientes e histórico de atendimentos.',
  },
  barbershop: {
    title: 'Personalizar Barbearia - ZapCorte',
    description: 'Personalize o visual e informações da sua barbearia.',
  },
  whatsapp: {
    title: 'WhatsApp - ZapCorte',
    description: 'Configure mensagens automáticas e lembretes via WhatsApp.',
  },
  plan: {
    title: 'Plano & Conta - ZapCorte',
    description: 'Gerencie seu plano e informações da conta.',
  },
  myAppointments: {
    title: 'Meus Agendamentos - ZapCorte',
    description: 'Consulte seus agendamentos realizados.',
  },
};
