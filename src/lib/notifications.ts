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
  console.log('🚀 [WEBHOOK] Iniciando notificação de novo agendamento...');
  
  try {
    // Buscar dados da barbearia para pegar o número do barbeiro
    console.log('🔍 [WEBHOOK] Buscando dados da barbearia:', barbershopId);
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('whatsapp_number, name, user_id')
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

    // Enviar mensagem de "agendamento recebido" se os dados estiverem disponíveis
    if (customerPhone) {
      console.log('📱 [WEBHOOK] Enviando mensagem WhatsApp para cliente...');
      await enviarLembreteWhatsApp({
        barbershopId,
        customerName,
        customerPhone,
        scheduledAt,
        serviceName: serviceName || 'Serviço',
        tipo: 'recebido', // Mudado de 'confirmacao' para 'recebido'
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
  tipo = 'recebido'
}: {
  barbershopId: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
  tipo?: 'recebido' | 'confirmacao' | 'lembrete' | 'cancelamento' | 'reagendamento';
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

    // Usar nome da barbearia como nome do barbeiro
    const barbeiroNome = barbershop.name || 'Barbeiro';

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
      recebido: `📋 *Agendamento Recebido!*

Olá *${primeiroNome}*! 

Recebemos seu pedido de agendamento:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
🏪 *Local:* ${barbershop.name}

⏳ *Aguarde a confirmação do barbeiro!*

Seu horário está sendo analisado e em breve você receberá a confirmação. Isso garante que possamos atendê-lo com a melhor qualidade possível.

_Mensagem enviada automaticamente pelo ZapCorte_`,
      confirmacao: `✅ *Agendamento Confirmado!*

Olá *${primeiroNome}*! 

Seu agendamento foi *confirmado* pelo barbeiro:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${barbeiroNome}
🏪 *Local:* ${barbershop.name}

🎉 Está tudo certo! Nos vemos em breve!

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
      case 'recebido':
        // Sempre usa mensagem padrão para "recebido" (não personalizável)
        mensagem = mensagensPadrao.recebido;
        break;

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