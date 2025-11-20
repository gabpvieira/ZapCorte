import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'new_appointment' | 'cancelled' | 'confirmed' | 'reminder';
  title: string;
  message: string;
  appointment_id?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = (barbershopId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!barbershopId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!barbershopId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('barbershop_id', barbershopId)
        .eq('read', false);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Limpar todas as notificações
  const clearAll = async () => {
    if (!barbershopId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('barbershop_id', barbershopId);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  // Buscar notificações ao montar e quando barbershopId mudar
  useEffect(() => {
    fetchNotifications();
  }, [barbershopId]);

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    if (!barbershopId) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `barbershop_id=eq.${barbershopId}`,
        },
        (payload) => {
          console.log('Notificação em tempo real:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Nova notificação
            setNotifications(prev => [payload.new as Notification, ...prev]);
            if (!(payload.new as Notification).read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Notificação atualizada
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new as Notification : n))
            );
          } else if (payload.eventType === 'DELETE') {
            // Notificação deletada
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            if (!(payload.old as Notification).read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershopId]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchNotifications,
  };
};
