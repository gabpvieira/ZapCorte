import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { evolutionApi } from '@/lib/evolutionApi';

export interface WhatsAppSettings {
  reminders_enabled: boolean;
  reminder_interval: '30' | '60'; // minutos
  reminder_message: string;
  confirmation_message?: string;
  reschedule_message?: string;
}

const DEFAULT_SETTINGS: WhatsAppSettings = {
  reminders_enabled: true,
  reminder_interval: '30',
  reminder_message: 'Olá {nome}! Lembrete: você tem um agendamento marcado para {data} às {hora} para {servico}. Nos vemos em breve! 💈',
};

export const useWhatsAppSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WhatsAppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar configurações - SEM useCallback para evitar loops
  const loadSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: barbershop, error } = await supabase
        .from('barbershops')
        .select('whatsapp_reminders_enabled, whatsapp_reminder_interval, whatsapp_reminder_message, confirmation_message, reschedule_message')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (barbershop) {
        setSettings({
          reminders_enabled: barbershop.whatsapp_reminders_enabled ?? DEFAULT_SETTINGS.reminders_enabled,
          reminder_interval: barbershop.whatsapp_reminder_interval ?? DEFAULT_SETTINGS.reminder_interval,
          reminder_message: barbershop.whatsapp_reminder_message ?? DEFAULT_SETTINGS.reminder_message,
          confirmation_message: barbershop.confirmation_message,
          reschedule_message: barbershop.reschedule_message,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setError('Erro ao carregar configurações do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const saveSettings = async (newSettings: Partial<WhatsAppSettings>) => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };

      // Se está tentando ativar lembretes, verificar se há dias ativos
      if (newSettings.reminders_enabled === true) {
        const { data: barbershop, error: checkError } = await supabase
          .from('barbershops')
          .select('opening_hours')
          .eq('user_id', user.id)
          .single();

        if (checkError) throw checkError;

        // Verificar se há pelo menos um dia ativo
        const openingHours = barbershop?.opening_hours || {};
        const hasActiveDays = Object.values(openingHours).some(day => day !== null);

        if (!hasActiveDays) {
          throw new Error('Configure pelo menos um dia de funcionamento antes de ativar os lembretes');
        }
      }

      const updateData: any = {
        whatsapp_reminders_enabled: updatedSettings.reminders_enabled,
        whatsapp_reminder_interval: updatedSettings.reminder_interval,
        whatsapp_reminder_message: updatedSettings.reminder_message,
      };

      // Adicionar mensagens personalizadas se existirem
      if (updatedSettings.confirmation_message !== undefined) {
        updateData.confirmation_message = updatedSettings.confirmation_message;
      }
      if (updatedSettings.reschedule_message !== undefined) {
        updateData.reschedule_message = updatedSettings.reschedule_message;
      }

      const { error } = await supabase
        .from('barbershops')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      setError(errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Testar envio de mensagem para o próprio número conectado
  const testMessage = async () => {
    if (!user?.id) return false;

    try {
      // Buscar dados da barbearia incluindo o número conectado
      const { data: barbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id, name, whatsapp_session_id, whatsapp_connected, whatsapp_phone')
        .eq('user_id', user.id)
        .single();

      if (barbershopError) throw barbershopError;

      if (!barbershop.whatsapp_session_id) {
        throw new Error('WhatsApp não está conectado');
      }

      if (!barbershop.whatsapp_connected) {
        throw new Error('WhatsApp não está conectado');
      }

      // Se não tiver número salvo, tentar obter da API
      let phoneNumber = barbershop.whatsapp_phone;
      
      if (!phoneNumber) {
        console.log('Número não encontrado no banco, buscando da API...');
        
        // Tentar obter informações da instância
        const instanceInfo = await evolutionApi.getInstanceInfo(barbershop.whatsapp_session_id);
        
        if (instanceInfo.phone) {
          phoneNumber = instanceInfo.phone;
          console.log('Número obtido da API:', phoneNumber);
        } else {
          // Fallback: tentar pelo status
          const session = await evolutionApi.getSessionStatus(barbershop.whatsapp_session_id);
          if (session.phone) {
            phoneNumber = session.phone;
            console.log('Número obtido do status:', phoneNumber);
          }
        }
        
        if (phoneNumber) {
          // Atualizar no banco para próximas vezes
          await supabase
            .from('barbershops')
            .update({ whatsapp_phone: phoneNumber })
            .eq('id', barbershop.id);
          
          console.log('Número atualizado no banco:', phoneNumber);
        } else {
          throw new Error('Não foi possível obter o número do WhatsApp. Tente reconectar.');
        }
      }

      // Formatar mensagem de teste
      const testMessageContent = settings.reminder_message
        .replace('{nome}', 'Você (Teste)')
        .replace('{data}', new Date().toLocaleDateString('pt-BR'))
        .replace('{hora}', '14:30')
        .replace('{servico}', 'Corte + Barba');

      // Enviar mensagem para o próprio número
      const success = await evolutionApi.sendMessage(barbershop.whatsapp_session_id, {
        phone: phoneNumber,
        message: `🧪 TESTE - ${barbershop.name}\n\n${testMessageContent}\n\n---\nEsta é uma mensagem de teste do sistema de lembretes enviada para você mesmo.`,
      });

      return success;
    } catch (error) {
      console.error('Erro ao testar mensagem:', error);
      throw error;
    }
  };

  // Carregar configurações quando o componente montar ou user mudar
  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: barbershop, error } = await supabase
          .from('barbershops')
          .select('whatsapp_reminders_enabled, whatsapp_reminder_interval, whatsapp_reminder_message, confirmation_message, reschedule_message')
          .eq('user_id', user.id)
          .single();

        if (!mounted) return;

        if (error) throw error;

        if (barbershop) {
          setSettings({
            reminders_enabled: barbershop.whatsapp_reminders_enabled ?? DEFAULT_SETTINGS.reminders_enabled,
            reminder_interval: barbershop.whatsapp_reminder_interval ?? DEFAULT_SETTINGS.reminder_interval,
            reminder_message: barbershop.whatsapp_reminder_message ?? DEFAULT_SETTINGS.reminder_message,
            confirmation_message: barbershop.confirmation_message,
            reschedule_message: barbershop.reschedule_message,
          });
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Erro ao carregar configurações:', error);
        setError('Erro ao carregar configurações do WhatsApp');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    testMessage,
    refreshSettings: loadSettings,
  };
};