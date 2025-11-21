import { supabase } from '@/lib/supabase';
import { evolutionApi } from '@/lib/evolutionApi';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para buscar nome do barbeiro
async function getBarberName(appointmentId: string, barbershopId?: string): Promise<string> {
  try {
    console.log('[WhatsApp] Buscando nome do barbeiro para appointment:', appointmentId);
    
    // Primeiro, buscar o appointment para pegar o barber_id
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('barber_id, barbershop_id')
      .eq('id', appointmentId)
      .single();
    
    if (appointmentError) {
      console.error('[WhatsApp] Erro ao buscar appointment:', appointmentError);
      return 'Qualquer barbeiro disponível';
    }

    if (!appointment?.barber_id) {
      console.log('[WhatsApp] Appointment sem barber_id definido');
      return 'Qualquer barbeiro disponível';
    }

    console.log('[WhatsApp] barber_id encontrado:', appointment.barber_id);

    // Buscar o barbeiro pelo ID
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('name')
      .eq('id', appointment.barber_id)
      .single();
    
    if (barberError) {
      console.error('[WhatsApp] Erro ao buscar barbeiro:', barberError);
      return 'Qualquer barbeiro disponível';
    }

    if (barber?.name) {
      console.log('[WhatsApp] Nome do barbeiro encontrado:', barber.name);
      return barber.name;
    }

    console.log('[WhatsApp] Barbeiro não encontrado');
    return 'Qualquer barbeiro disponível';
  } catch (error) {
    console.error('[WhatsApp] Erro geral ao buscar barbeiro:', error);
    return 'Qualquer barbeiro disponível';
  }
}

export async function notificarNovoAgendamento({
  barbershopId,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName,
  appointmentId,
}: {
  barbershopId: string;
  customerName: string;
  scheduledAt: string;
  customerPhone?: string;
  serviceName?: string;
  appointmentId?: string;
}) {
  console.log('🚀 [WEBHOOK] Iniciando notificação de novo agendamento...');
  
  try {
    // Buscar dados da barbearia para pegar o número do barbeiro
    console.log('🔍 [WEBHOOK] Buscando dados da barbearia:', barbershopId);
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_number, name, user_id, push_subscription')
      .eq('id', barbershopId)
      .single();

    if (barbershopError) {
      console.error('❌ [WEBHOOK] Erro ao buscar barbearia:', barbershopError);
      return false;
    }

    if (!barbershop) {
      console.error('❌ [WEBHOOK] Barbearia não encontrada');
      return false;
    }

    console.log('✅ [WEBHOOK] Barbearia encontrada:', barbershop.name);

    // Enviar notificação push se estiver ativada
    if (barbershop.push_subscription) {
      console.log('📱 [PUSH] Enviando notificação push...');
      try {
        const response = await fetch('/api/send-push-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            barbershopId,
            type: 'new_appointment',
            data: {
              customerName,
              scheduledAt,
              serviceName: serviceName || 'Serviço',
            },
          }),
        });

        if (response.ok) {
          console.log('✅ [PUSH] Notificação push enviada com sucesso');
        } else {
          console.error('❌ [PUSH] Erro ao enviar notificação push:', await response.text());
        }
      } catch (pushError) {
        console.error('❌ [PUSH] Erro ao enviar notificação push:', pushError);
      }
    } else {
      console.log('ℹ️ [PUSH] Notificações push não ativadas para esta barbearia');
    }

    // Formatar data e hora
    const date = new Date(scheduledAt);
    const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR });
    const horaFormatada = format(date, "HH:mm");

    // Enviar para webhook n8n
    const webhookData = {
      // Dados do cliente
      customerName,
      customerPhone: customerPhone || '',
      
      // Dados do agendamento
      serviceName: serviceName || 'Serviço',
      scheduledDate: dataFormatada,
      scheduledTime: horaFormatada,
      scheduledDateTime: scheduledAt,
      
      // Dados da barbearia
      barbershopId,
      barbershopName: barbershop.name,
      barbershopPhone: barbershop.whatsapp_number || '',
      
      // Timestamp
      timestamp: new Date().toISOString(),
    };

    console.log('📨 [WEBHOOK] Enviando para n8n:', {
      url: 'https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes',
      data: webhookData
    });

    try {
      const response = await fetch('https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        mode: 'no-cors', // Adiciona modo no-cors para evitar problemas de CORS
      });

      // Com mode: 'no-cors', response.ok sempre será false e não podemos ler o body
      // Mas a requisição será enviada
      console.log('✅ [WEBHOOK] Requisição enviada para n8n (no-cors mode)');
      console.log('ℹ️ [WEBHOOK] Status:', response.type, '- A requisição foi enviada mas não podemos verificar a resposta devido ao CORS');
      
    } catch (fetchError) {
      console.error('❌ [WEBHOOK] Erro ao fazer fetch para n8n:', fetchError);
      // Mesmo com erro, continua o fluxo
    }

    // Enviar mensagem de "Agendamento Recebido" para o cliente
    if (customerPhone) {
      console.log('📱 [WEBHOOK] Enviando mensagem de agendamento recebido para cliente...');
      await enviarMensagemAgendamentoRecebido({
        barbershopId,
        barbershopName: barbershop.name,
        customerName,
        customerPhone,
        scheduledAt,
        serviceName: serviceName || 'Serviço',
        appointmentId,
      });
    }

    console.log('✅ [WEBHOOK] Processo de notificação concluído');
    return true;
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro geral ao notificar novo agendamento:', error);
    return false;
  }
}

export async function enviarLembreteWhatsApp({
  barbershopId,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  tipo = 'confirmacao',
  appointmentId
}: {
  barbershopId: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
  tipo?: 'confirmacao' | 'lembrete' | 'cancelamento' | 'reagendamento';
  appointmentId?: string;
}) {
  try {
    // Buscar dados da barbearia e verificar se WhatsApp está conectado
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected, name, user_id, confirmation_message, reminder_message, reschedule_message, plan_type')
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

    // Buscar nome do barbeiro APENAS se for plano PRO e appointmentId foi fornecido
    const isPro = barbershop.plan_type === 'pro';
    let barbeiroNome: string | null = null;
    
    if (isPro && appointmentId) {
      const nome = await getBarberName(appointmentId, barbershopId);
      // Só usar o nome se não for a mensagem padrão
      barbeiroNome = (nome && nome !== 'Qualquer barbeiro disponível') ? nome : null;
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
      confirmacao: barbeiroNome ? `✅ *Agendamento Confirmado!*

Olá *${primeiroNome}*! 

Seu agendamento foi *confirmado*:

👤 *Barbeiro:* ${barbeiroNome}
📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

${barbeiroNome} te espera! 💈

_Mensagem enviada automaticamente pelo ZapCorte_` : `✅ *Agendamento Confirmado!*

Olá *${primeiroNome}*! 

Seu agendamento foi *confirmado*:

📅 *Data:* ${diaSemana}, ${dataFormatada}
� *Hoorário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

Nos vemos em breve! 💈

_Mensagem enviada automaticamente pelo ZapCorte_`,
      lembrete: barbeiroNome ? `⏰ *Lembrete de Agendamento*

Olá *${primeiroNome}*!

Este é um lembrete do seu agendamento:

👤 *Com:* ${barbeiroNome}
📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

${barbeiroNome} está te esperando! 💈

_Mensagem enviada automaticamente pelo ZapCorte_` : `⏰ *Lembrete de Agendamento*

Olá *${primeiroNome}*!

Este é um lembrete do seu agendamento:

� *Data:* o${diaSemana}, ${dataFormatada}
� *NHorário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

Te esperamos! 💈

_Mensagem enviada automaticamente pelo ZapCorte_`,
      cancelamento: barbeiroNome ? `❌ *Agendamento Cancelado*

Olá *${primeiroNome}*, informamos que seu agendamento foi cancelado:

👤 *Barbeiro:* ${barbeiroNome}
📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar com ${barbeiroNome} ou outro profissional, entre em contato conosco.

_Aviso automático - ZapCorte_` : `❌ *Agendamento Cancelado*

Olá *${primeiroNome}*, informamos que seu agendamento foi cancelado:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar, entre em contato conosco.

_Aviso automático - ZapCorte_`,
      reagendamento: barbeiroNome ? `🔄 *Agendamento Reagendado!*

Olá *${primeiroNome}*!

Seu agendamento foi reagendado com sucesso:

👤 *Barbeiro:* ${barbeiroNome}
📅 *Nova Data:* ${diaSemana}, ${dataFormatada}
🕐 *Novo Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

${barbeiroNome} te espera no novo horário! 💈

_Mensagem enviada automaticamente pelo ZapCorte_` : `🔄 *Agendamento Reagendado!*

Olá *${primeiroNome}*!

Seu agendamento foi reagendado com sucesso:

📅 *Nova Data:* ${diaSemana}, ${dataFormatada}
🕐 *Novo Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

Te esperamos no novo horário! 💈

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

// Função específica para enviar cancelamento com link da barbearia
export async function enviarCancelamentoWhatsApp({
  barbershopId,
  barbershopSlug,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  appointmentId,
}: {
  barbershopId: string;
  barbershopSlug: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
  appointmentId?: string;
}) {
  try {
    // Buscar dados da barbearia e verificar se WhatsApp está conectado
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected, name, plan_type')
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

    // Buscar nome do barbeiro APENAS se for plano PRO e appointmentId foi fornecido
    const isPro = barbershop.plan_type === 'pro';
    let barbeiroNome: string | null = null;
    
    if (isPro && appointmentId) {
      const nome = await getBarberName(appointmentId, barbershopId);
      // Só usar o nome se não for a mensagem padrão
      barbeiroNome = (nome && nome !== 'Qualquer barbeiro disponível') ? nome : null;
    }

    // Formatar data e hora
    const date = new Date(scheduledAt);
    const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR });
    const horaFormatada = format(date, "HH:mm");

    // Extrair primeiro nome
    const primeiroNome = customerName.split(' ')[0];

    // Construir link da página do barbeiro
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zapcorte.com';
    const linkBarbeiro = `${baseUrl}/barbershop/${barbershopSlug}`;

    // Mensagem de cancelamento com link (e nome do barbeiro apenas se PRO)
    const mensagem = barbeiroNome ? `❌ *Agendamento Cancelado*

Olá *${primeiroNome}*, informamos que seu agendamento foi cancelado:

� *DBarbeiro:* ${barbeiroNome}
� **Data:* ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar com *${barbeiroNome}* ou outro profissional, clique no link abaixo: 👇
${linkBarbeiro}

_Aviso automático - ZapCorte_` : `❌ *Agendamento Cancelado*

Olá *${primeiroNome}*, informamos que seu agendamento foi cancelado:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Para reagendar, clique no link abaixo: 👇
${linkBarbeiro}

_Aviso automático - ZapCorte_`;

    console.log('[WhatsApp] Enviando cancelamento:', {
      sessionId: barbershop.whatsapp_session_id,
      customerPhone,
      customerName,
      linkBarbeiro
    });

    // Enviar mensagem via Evolution API
    const sucesso = await evolutionApi.sendMessage(barbershop.whatsapp_session_id, {
      phone: customerPhone,
      message: mensagem,
    });

    if (sucesso) {
      console.log(`[WhatsApp] ✅ Mensagem de cancelamento enviada para ${customerName} (${customerPhone})`);
      return true;
    } else {
      console.error('[WhatsApp] ❌ Falha ao enviar mensagem de cancelamento');
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Erro ao enviar cancelamento:', error);
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


// Função para enviar mensagem de "Agendamento Recebido" ao cliente
export async function enviarMensagemAgendamentoRecebido({
  barbershopId,
  barbershopName,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  appointmentId,
}: {
  barbershopId: string;
  barbershopName: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
  appointmentId?: string;
}) {
  try {
    // Buscar dados da barbearia para verificar se WhatsApp está conectado
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      console.error('[WhatsApp] Erro ao buscar barbearia:', barbershopError);
      return false;
    }

    if (!barbershop.whatsapp_connected || !barbershop.whatsapp_session_id) {
      console.log('[WhatsApp] WhatsApp não conectado para esta barbearia');
      return false;
    }

    // Buscar nome do barbeiro se appointmentId foi fornecido
    const barbeiroNome = appointmentId ? await getBarberName(appointmentId) : 'Qualquer barbeiro disponível';

    // Formatar data e hora
    const date = new Date(scheduledAt);
    const dataFormatada = format(date, "dd/MM/yyyy", { locale: ptBR });
    const diaSemana = format(date, "EEEE", { locale: ptBR });
    const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const horaFormatada = format(date, "HH:mm");

    // Extrair primeiro nome
    const primeiroNome = customerName.split(' ')[0];

    // Mensagem padrão de agendamento recebido (não personalizável)
    const mensagem = `✂️ *AGENDAMENTO RECEBIDO!*

Opa, *${primeiroNome}!* 👋
Seu agendamento foi feito com sucesso:

👤 *Barbeiro:* ${barbeiroNome}
📆 *Data:* ${diaSemanaCapitalizado}, ${dataFormatada}
⏰ *Horário:* ${horaFormatada}
💈 *Serviço:* ${serviceName}

⏳ *Aguardando confirmação${barbeiroNome !== 'Qualquer barbeiro disponível' ? ` de ${barbeiroNome}` : ' do barbeiro'}.*

Você receberá a confirmação em breve! ✅

_Mensagem automática – ZapCorte_`;

    console.log('[WhatsApp] Enviando mensagem de agendamento recebido:', {
      sessionId: barbershop.whatsapp_session_id,
      customerPhone,
      customerName,
    });

    // Enviar mensagem via Evolution API
    const sucesso = await evolutionApi.sendMessage(barbershop.whatsapp_session_id, {
      phone: customerPhone,
      message: mensagem,
    });

    if (sucesso) {
      console.log(`[WhatsApp] ✅ Mensagem de agendamento recebido enviada para ${customerName} (${customerPhone})`);
      return true;
    } else {
      console.error(`[WhatsApp] ❌ Falha ao enviar mensagem de agendamento recebido para ${customerPhone}`);
      return false;
    }

  } catch (error) {
    console.error('[WhatsApp] ❌ Erro ao enviar mensagem de agendamento recebido:', error);
    return false;
  }
}
