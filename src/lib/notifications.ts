import { supabase } from '@/lib/supabase';
import { evolutionApi } from '@/lib/evolutionApi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function notificarNovoAgendamento({
  barbershopId,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName,
}: {
  barbershopId: string;
  customerName: string;
  scheduledAt: string;
  customerPhone?: string;
  serviceName?: string;
}) {
  try {
    // Enviar notificação push via API
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopId,
        customerName,
        scheduledAt,
        serviceName,
      }),
    });

    // Enviar lembrete WhatsApp se os dados estiverem disponíveis
    if (customerPhone) {
      await enviarLembreteWhatsApp({
        barbershopId,
        customerName,
        customerPhone,
        scheduledAt,
        serviceName: serviceName || 'Serviço',
        tipo: 'confirmacao',
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function enviarLembreteWhatsApp({
  barbershopId,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  tipo = 'confirmacao'
}: {
  barbershopId: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
  tipo?: 'confirmacao' | 'lembrete' | 'cancelamento' | 'reagendamento';
}) {
  try {
    // Buscar dados da barbearia e verificar se WhatsApp está conectado
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected, name, user_id, confirmation_message, reminder_message, reschedule_message')
      .eq('id', barbershopId)
      .single();

    if (barbershopError) {
      console.error('[WhatsApp] Erro ao buscar barbearia:', barbershopError);
      return false;
    }

    if (!barbershop.whatsapp_connected || !barbershop.whatsapp_session_id) {
      console.log('[WhatsApp] WhatsApp não conectado para esta barbearia');
      return false;
    }

    // Buscar nome do barbeiro/usuário
    let barbeiroNome = 'Barbeiro';
    if (barbershop.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', barbershop.user_id)
        .single();
      
      if (user?.name) {
        barbeiroNome = user.name;
      }
    }

    // Formatar data e hora
    const date = new Date(scheduledAt);
    const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR });
    const diaSemana = format(date, "EEEE", { locale: ptBR });
    const horaFormatada = format(date, "HH:mm");

    // Extrair primeiro nome
    const primeiroNome = customerName.split(' ')[0];

    // Função para substituir variáveis na mensagem
    const substituirVariaveis = (template: string) => {
      return template
        .replace(/\{\{primeiro_nome\}\}/g, primeiroNome)
        .replace(/\{\{servico\}\}/g, serviceName)
        .replace(/\{\{data\}\}/g, dataFormatada)
        .replace(/\{\{hora\}\}/g, horaFormatada)
        .replace(/\{\{barbearia\}\}/g, barbershop.name)
        .replace(/\{\{barbeiro\}\}/g, barbeiroNome)
        .replace(/\{\{dia_semana\}\}/g, diaSemana);
    };

    // Mensagens padrão caso não haja personalização
    const mensagensPadrao = {
      confirmacao: `🎉 *Agendamento Confirmado!*

Olá *${primeiroNome}*! 

Seu agendamento foi confirmado com sucesso:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

Estamos ansiosos para atendê-lo!

_Mensagem enviada automaticamente pelo ZapCorte_`,
      lembrete: `⏰ *Lembrete de Agendamento*

Olá *${primeiroNome}*!

Este é um lembrete do seu agendamento:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

Nos vemos em breve!

_Mensagem enviada automaticamente pelo ZapCorte_`,
      cancelamento: `❌ *Agendamento Cancelado*

Olá *${primeiroNome}*,

Seu agendamento foi cancelado:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar, entre em contato conosco.

_Mensagem enviada automaticamente pelo ZapCorte_`,
      reagendamento: `🔄 *Agendamento Reagendado!*

Olá *${primeiroNome}*!

Seu agendamento foi reagendado com sucesso:

📅 *Nova Data:* ${diaSemana}, ${dataFormatada}
🕐 *Novo Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

Qualquer dúvida, estamos à disposição!

_Mensagem enviada automaticamente pelo ZapCorte_`
    };

    // Gerar mensagem baseada no tipo, usando personalizada se disponível
    let mensagem = '';
    
    switch (tipo) {
      case 'confirmacao':
        mensagem = barbershop.confirmation_message 
          ? substituirVariaveis(barbershop.confirmation_message)
          : mensagensPadrao.confirmacao;
        break;

      case 'lembrete':
        mensagem = barbershop.reminder_message 
          ? substituirVariaveis(barbershop.reminder_message)
          : mensagensPadrao.lembrete;
        break;

      case 'cancelamento':
        mensagem = barbershop.reschedule_message 
          ? substituirVariaveis(barbershop.reschedule_message)
          : mensagensPadrao.cancelamento;
        break;

      case 'reagendamento':
        mensagem = barbershop.reschedule_message 
          ? substituirVariaveis(barbershop.reschedule_message)
          : mensagensPadrao.reagendamento;
        break;
    }

    // Log detalhado antes de enviar
    console.log('[WhatsApp] Preparando envio:', {
      sessionId: barbershop.whatsapp_session_id,
      customerPhone,
      customerName,
      tipo,
      mensagemPersonalizada: tipo === 'confirmacao' ? !!barbershop.confirmation_message : 
                             tipo === 'lembrete' ? !!barbershop.reminder_message : 
                             !!barbershop.reschedule_message,
      mensagemLength: mensagem.length
    });

    // Enviar mensagem via Evolution API
    const sucesso = await evolutionApi.sendMessage(barbershop.whatsapp_session_id, {
      phone: customerPhone,
      message: mensagem,
    });

    if (sucesso) {
      console.log(`[WhatsApp] ✅ Mensagem de ${tipo} enviada para ${customerName} (${customerPhone})`);
      return true;
    } else {
      console.error(`[WhatsApp] ❌ Falha ao enviar mensagem de ${tipo} para ${customerPhone}`);
      return false;
    }

  } catch (error) {
    console.error('[WhatsApp] ❌ Erro ao enviar lembrete:', error);
    return false;
  }
}

// Função para enviar lembrete antes do agendamento (pode ser chamada por um cron job)
export async function enviarLembreteProximo(agendamentoId: string) {
  try {
    const { data: agendamento, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(name),
        barbershop:barbershops(id, name, whatsapp_session_id, whatsapp_connected, users!inner(name))
      `)
      .eq('id', agendamentoId)
      .single();

    if (error) throw error;

    if (agendamento.barbershop.whatsapp_connected) {
      await enviarLembreteWhatsApp({
        barbershopId: agendamento.barbershop.id,
        customerName: agendamento.customer_name,
        customerPhone: agendamento.customer_phone,
        scheduledAt: agendamento.scheduled_at,
        serviceName: agendamento.service?.name || 'Serviço',
        tipo: 'lembrete',
      });
    }

  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar lembrete próximo:', error);
  }
}