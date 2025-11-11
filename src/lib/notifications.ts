import logotipo from "@/assets/zapcorte-icon.png";
import { supabase } from '@/lib/supabase';
import { evolutionApi } from '@/lib/evolutionApi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function notificarNovoAgendamento({
  playerId,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName,
  barbershopId,
}: {
  playerId: string;
  customerName: string;
  scheduledAt: string;
  customerPhone?: string;
  serviceName?: string;
  barbershopId?: string;
}) {
  const date = new Date(scheduledAt);
  const hoje = new Date().toDateString() === date.toDateString();
  const dataFormatada = date.toLocaleDateString("pt-BR");
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const titulo = "Novo agendamento!";
  const corpo = `${customerName} agendou um horário para ${hoje ? "hoje" : dataFormatada} às ${hora}.`;

  // Enviar notificação OneSignal (mantido para compatibilidade)
  const payload = {
    app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    headings: { en: titulo },
    contents: { en: corpo },
    url: import.meta.env.VITE_ONESIGNAL_CLICK_URL || "https://zapcorte.com/painel",
    chrome_web_icon: logotipo,
  };

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[OneSignal v16] Notificação enviada:", data);

    // Enviar lembrete WhatsApp se os dados estiverem disponíveis
    if (customerPhone && barbershopId) {
      await enviarLembreteWhatsApp({
        barbershopId,
        customerName,
        customerPhone,
        scheduledAt,
        serviceName: serviceName || 'Serviço',
        tipo: 'confirmacao',
      });
    }

    return data;
  } catch (error) {
    console.error("[OneSignal v16] Falha ao enviar notificação:", error);
    throw error;
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
  tipo?: 'confirmacao' | 'lembrete' | 'cancelamento';
}) {
  try {
    // Buscar dados da barbearia e verificar se WhatsApp está conectado
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected, name, user_id')
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

    // Gerar mensagem baseada no tipo
    let mensagem = '';
    
    switch (tipo) {
      case 'confirmacao':
        mensagem = `🎉 *Agendamento Confirmado!*

Olá *${customerName}*! 

Seu agendamento foi confirmado com sucesso:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

Estamos ansiosos para atendê-lo!

_Mensagem enviada automaticamente pelo ZapCorte_`;
        break;

      case 'lembrete':
        mensagem = `⏰ *Lembrete de Agendamento*

Olá *${customerName}*!

Este é um lembrete do seu agendamento:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

Nos vemos em breve!

_Mensagem enviada automaticamente pelo ZapCorte_`;
        break;

      case 'cancelamento':
        mensagem = `❌ *Agendamento Cancelado*

Olá *${customerName}*,

Seu agendamento foi cancelado:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar, entre em contato conosco.

_Mensagem enviada automaticamente pelo ZapCorte_`;
        break;
    }

    // Log detalhado antes de enviar
    console.log('[WhatsApp] Preparando envio:', {
      sessionId: barbershop.whatsapp_session_id,
      customerPhone,
      customerName,
      tipo,
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