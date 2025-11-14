import { toast } from "@/hooks/use-toast";

/**
 * Sistema de notificações premium do ZapCorte
 * Com paleta escura, ícones e efeitos sonoros
 */

export const showToast = {
  /**
   * Notificação de sucesso (verde)
   */
  success: (title: string, description?: string) => {
    toast({
      variant: "success",
      title,
      description,
      duration: 4000,
    });
  },

  /**
   * Notificação de erro (vermelho)
   */
  error: (title: string, description?: string) => {
    toast({
      variant: "destructive",
      title,
      description,
      duration: 5000,
    });
  },

  /**
   * Notificação de aviso (amarelo)
   */
  warning: (title: string, description?: string) => {
    toast({
      variant: "warning",
      title,
      description,
      duration: 4000,
    });
  },

  /**
   * Notificação informativa (azul)
   */
  info: (title: string, description?: string) => {
    toast({
      variant: "info",
      title,
      description,
      duration: 4000,
    });
  },

  /**
   * Notificação padrão (primary)
   */
  default: (title: string, description?: string) => {
    toast({
      variant: "default",
      title,
      description,
      duration: 4000,
    });
  },

  /**
   * Notificações específicas do ZapCorte
   */
  auth: {
    loginSuccess: (userName?: string) => {
      toast({
        variant: "success",
        title: "Login realizado! 🎉",
        description: userName ? `Bem-vindo de volta, ${userName}!` : "Bem-vindo de volta!",
        duration: 3000,
      });
    },

    logoutSuccess: () => {
      toast({
        variant: "info",
        title: "Logout realizado",
        description: "Até logo! Volte sempre.",
        duration: 3000,
      });
    },

    loginError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
        duration: 5000,
      });
    },

    sessionExpired: () => {
      toast({
        variant: "warning",
        title: "Sessão expirada",
        description: "Por favor, faça login novamente.",
        duration: 5000,
      });
    },
  },

  appointment: {
    created: () => {
      toast({
        variant: "success",
        title: "Agendamento criado! 📅",
        description: "O cliente receberá uma confirmação via WhatsApp.",
        duration: 4000,
      });
    },

    updated: () => {
      toast({
        variant: "success",
        title: "Agendamento atualizado",
        description: "As alterações foram salvas com sucesso.",
        duration: 3000,
      });
    },

    deleted: () => {
      toast({
        variant: "info",
        title: "Agendamento cancelado",
        description: "O horário foi liberado.",
        duration: 3000,
      });
    },

    confirmed: () => {
      toast({
        variant: "success",
        title: "Agendamento confirmado! ✅",
        description: "O cliente foi notificado.",
        duration: 3000,
      });
    },

    error: () => {
      toast({
        variant: "destructive",
        title: "Erro no agendamento",
        description: "Não foi possível processar a solicitação. Tente novamente.",
        duration: 5000,
      });
    },
  },

  service: {
    created: () => {
      toast({
        variant: "success",
        title: "Serviço criado! ✂️",
        description: "O novo serviço está disponível para agendamento.",
        duration: 3000,
      });
    },

    updated: () => {
      toast({
        variant: "success",
        title: "Serviço atualizado",
        description: "As alterações foram salvas.",
        duration: 3000,
      });
    },

    deleted: () => {
      toast({
        variant: "info",
        title: "Serviço removido",
        description: "O serviço não está mais disponível.",
        duration: 3000,
      });
    },
  },

  settings: {
    saved: () => {
      toast({
        variant: "success",
        title: "Configurações salvas! ⚙️",
        description: "Suas preferências foram atualizadas.",
        duration: 3000,
      });
    },

    error: () => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        duration: 4000,
      });
    },
  },

  whatsapp: {
    sent: () => {
      toast({
        variant: "success",
        title: "Mensagem enviada! 💬",
        description: "O cliente receberá a notificação em breve.",
        duration: 3000,
      });
    },

    error: () => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Verifique a configuração do WhatsApp.",
        duration: 5000,
      });
    },
  },

  payment: {
    success: () => {
      toast({
        variant: "success",
        title: "Pagamento confirmado! 💳",
        description: "Seu plano foi ativado com sucesso.",
        duration: 4000,
      });
    },

    pending: () => {
      toast({
        variant: "warning",
        title: "Pagamento pendente",
        description: "Aguardando confirmação do pagamento.",
        duration: 4000,
      });
    },

    error: () => {
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        duration: 5000,
      });
    },
  },

  network: {
    offline: () => {
      toast({
        variant: "warning",
        title: "Você está offline",
        description: "Alguns recursos podem estar limitados.",
        duration: 5000,
      });
    },

    online: () => {
      toast({
        variant: "success",
        title: "Conexão restaurada",
        description: "Você está online novamente.",
        duration: 3000,
      });
    },
  },
};
