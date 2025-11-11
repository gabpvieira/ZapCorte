import { supabase } from './supabase';
import { evolutionApi } from './evolutionApi';
import { format, parseISO, subMinutes } from 'date-fns';

export interface ReminderJob {
  id: string;
  appointment_id: string;
  scheduled_for: string;
  message: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
}

class ReminderScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Iniciar o scheduler de lembretes
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔔 Scheduler de lembretes iniciado');
    
    // Verificar lembretes a cada minuto
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, 60000); // 1 minuto
    
    // Processar imediatamente
    this.processReminders();
  }

  /**
   * Parar o scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🔔 Scheduler de lembretes parado');
  }

  /**
   * Processar lembretes pendentes
   */
  private async processReminders() {
    try {
      const now = new Date();
      
      // Buscar lembretes que devem ser enviados agora usando query SQL direta
      const { data: reminders, error } = await supabase.rpc('get_pending_reminders', {
        p_current_time: now.toISOString()
      });

      // Se a função não existir, usar query alternativa
      if (error && error.code === 'PGRST202') {
        const { data: alternativeReminders, error: altError } = await supabase
          .from('reminder_jobs')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_for', now.toISOString());

        if (altError) {
          console.error('Erro ao buscar lembretes:', altError);
          return;
        }

        // Para cada lembrete, buscar dados relacionados
        const enrichedReminders = [];
        for (const reminder of alternativeReminders || []) {
          const { data: appointment } = await supabase
            .from('appointments')
            .select('customer_name, customer_phone, scheduled_at, service_id, barbershop_id')
            .eq('id', reminder.appointment_id)
            .single();

          const { data: service } = await supabase
            .from('services')
            .select('name')
            .eq('id', appointment?.service_id)
            .single();

          const { data: barbershop } = await supabase
            .from('barbershops')
            .select('name, whatsapp_session_id, whatsapp_connected')
            .eq('id', appointment?.barbershop_id)
            .single();

          enrichedReminders.push({
            ...reminder,
            appointments: appointment,
            services: service,
            barbershops: barbershop
          });
        }

        if (enrichedReminders.length === 0) return;
        
        console.log(`📨 Processando ${enrichedReminders.length} lembretes`);
        for (const reminder of enrichedReminders) {
          await this.sendReminder(reminder);
        }
        return;
      }

      if (error) {
        console.error('Erro ao buscar lembretes:', error);
        return;
      }

      if (error) {
        console.error('Erro ao buscar lembretes:', error);
        return;
      }

      if (!reminders || reminders.length === 0) {
        return;
      }

      console.log(`📨 Processando ${reminders.length} lembretes`);

      for (const reminder of reminders) {
        await this.sendReminder(reminder);
      }
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
    }
  }

  /**
   * Enviar um lembrete específico
   */
  private async sendReminder(reminder: any) {
    try {
      // VERIFICAÇÃO CRÍTICA: Verificar se o lembrete já foi enviado
      const { data: existingReminder } = await supabase
        .from('reminder_jobs')
        .select('status')
        .eq('id', reminder.id)
        .single();

      if (existingReminder && existingReminder.status !== 'pending') {
        console.log(`⏭️ Lembrete ${reminder.id} já foi processado (status: ${existingReminder.status})`);
        return;
      }

      // Marcar como "processing" imediatamente para evitar duplicação
      await supabase
        .from('reminder_jobs')
        .update({ status: 'processing' })
        .eq('id', reminder.id)
        .eq('status', 'pending'); // Só atualiza se ainda estiver pending

      const appointment = reminder.appointments;
      const barbershop = reminder.barbershops;
      const service = reminder.services;
      
      if (!barbershop.whatsapp_connected || !barbershop.whatsapp_session_id) {
        console.warn(`WhatsApp não conectado para barbearia ${barbershop.name}`);
        await this.markReminderAsFailed(reminder.id, 'WhatsApp não conectado');
        return;
      }

      // Formatar a mensagem
      const scheduledDate = parseISO(appointment.scheduled_at);
      const formattedMessage = reminder.message
        .replace('{nome}', appointment.customer_name)
        .replace('{data}', format(scheduledDate, 'dd/MM/yyyy'))
        .replace('{hora}', format(scheduledDate, 'HH:mm'))
        .replace('{servico}', service?.name || 'Serviço');

      // Enviar mensagem
      const success = await evolutionApi.sendMessage(barbershop.whatsapp_session_id, {
        phone: appointment.customer_phone,
        message: formattedMessage,
      });

      if (success) {
        await this.markReminderAsSent(reminder.id);
        console.log(`✅ Lembrete enviado para ${appointment.customer_name}`);
      } else {
        await this.markReminderAsFailed(reminder.id, 'Falha no envio');
        console.error(`❌ Falha ao enviar lembrete para ${appointment.customer_name}`);
      }
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      await this.markReminderAsFailed(reminder.id, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  /**
   * Marcar lembrete como enviado
   */
  private async markReminderAsSent(reminderId: string) {
    await supabase
      .from('reminder_jobs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);
  }

  /**
   * Marcar lembrete como falhou
   */
  private async markReminderAsFailed(reminderId: string, error: string) {
    await supabase
      .from('reminder_jobs')
      .update({
        status: 'failed',
        error_message: error,
        failed_at: new Date().toISOString(),
      })
      .eq('id', reminderId);
  }

  /**
   * Criar lembretes para um agendamento
   */
  static async createRemindersForAppointment(appointmentId: string) {
    try {
      // VERIFICAÇÃO: Verificar se já existe lembrete pendente para este agendamento
      const { data: existingReminders } = await supabase
        .from('reminder_jobs')
        .select('id, status')
        .eq('appointment_id', appointmentId)
        .in('status', ['pending', 'processing']);

      if (existingReminders && existingReminders.length > 0) {
        console.log(`⏭️ Lembrete já existe para agendamento ${appointmentId}`);
        return;
      }

      // Buscar dados do agendamento e configurações da barbearia
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          barbershops (
            id,
            whatsapp_reminders_enabled,
            whatsapp_reminder_interval,
            whatsapp_reminder_message
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      const barbershop = appointment.barbershops;
      
      if (!barbershop.whatsapp_reminders_enabled) {
        console.log('Lembretes desabilitados para esta barbearia');
        return;
      }

      const scheduledAt = parseISO(appointment.scheduled_at);
      const reminderInterval = parseInt(barbershop.whatsapp_reminder_interval);
      const reminderTime = subMinutes(scheduledAt, reminderInterval);

      // Não criar lembrete se o horário já passou
      if (reminderTime <= new Date()) {
        console.log('Horário do lembrete já passou, não criando lembrete');
        return;
      }

      // Criar o job de lembrete
      const { error: reminderError } = await supabase
        .from('reminder_jobs')
        .insert({
          appointment_id: appointmentId,
          barbershop_id: barbershop.id,
          scheduled_for: reminderTime.toISOString(),
          message: barbershop.whatsapp_reminder_message,
          phone: appointment.customer_phone,
          status: 'pending',
        });

      if (reminderError) throw reminderError;

      console.log(`📅 Lembrete agendado para ${format(reminderTime, 'dd/MM/yyyy HH:mm')}`);
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
    }
  }

  /**
   * Cancelar lembretes de um agendamento
   */
  static async cancelRemindersForAppointment(appointmentId: string) {
    try {
      await supabase
        .from('reminder_jobs')
        .update({ status: 'cancelled' })
        .eq('appointment_id', appointmentId)
        .eq('status', 'pending');

      console.log(`🚫 Lembretes cancelados para agendamento ${appointmentId}`);
    } catch (error) {
      console.error('Erro ao cancelar lembretes:', error);
    }
  }
}

export const reminderScheduler = new ReminderScheduler();
export { ReminderScheduler };