# 📢 Correção: Mensagem de Cancelamento com Link

## 📋 Problema

A mensagem de cancelamento estava:
- ❌ Usando mensagem de reagendamento
- ❌ Sem link da página do barbeiro
- ❌ Formato incorreto

## ✅ Solução Implementada

### 1. **Nova Função Específica**
Criada `enviarCancelamentoWhatsApp` que:
- Envia mensagem diretamente via Evolution API
- Inclui link da página do barbeiro
- Usa formato solicitado

### 2. **Mensagem Correta**
```
📢 Olá *João*, informamos que seu *agendamento* para Corte + Barba às 14:30 foi cancelado.

Caso queira *agendar outro horário*, clique no link abaixo: 👇
https://zapcorte.com/barbershop/barbearia-do-joao

_Aviso automático - ZapCorte_
```

---

## 🔧 Implementação

### Arquivo: `src/lib/notifications.ts`

```typescript
export async function enviarCancelamentoWhatsApp({
  barbershopId,
  barbershopSlug,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
}: {
  barbershopId: string;
  barbershopSlug: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  serviceName: string;
}) {
  try {
    // Buscar dados da barbearia
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('whatsapp_session_id, whatsapp_connected, name')
      .eq('id', barbershopId)
      .single();

    if (!barbershop.whatsapp_connected) {
      return false;
    }

    // Formatar hora
    const horaFormatada = format(new Date(scheduledAt), "HH:mm");
    const primeiroNome = customerName.split(' ')[0];

    // Construir link
    const baseUrl = window.location.origin;
    const linkBarbeiro = `${baseUrl}/barbershop/${barbershopSlug}`;

    // Mensagem com link
    const mensagem = `📢 Olá *${primeiroNome}*, informamos que seu *agendamento* para ${serviceName} às ${horaFormatada} foi cancelado.

Caso queira *agendar outro horário*, clique no link abaixo: 👇
${linkBarbeiro}

_Aviso automático - ZapCorte_`;

    // Enviar via Evolution API
    const sucesso = await evolutionApi.sendMessage(
      barbershop.whatsapp_session_id,
      {
        phone: customerPhone,
        message: mensagem,
      }
    );

    return sucesso;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar cancelamento:', error);
    return false;
  }
}
```

### Uso no Dashboard e Appointments

```typescript
// Se foi cancelado, enviar mensagem WhatsApp
if (newStatus === 'cancelled' && appointmentData) {
  try {
    const serviceName = appointmentData.service?.name || 'Serviço';
    const barbershopSlug = appointmentData.barbershop?.slug || '';

    // Enviar via WhatsApp com link da barbearia
    const { enviarCancelamentoWhatsApp } = await import('@/lib/notifications');
    await enviarCancelamentoWhatsApp({
      barbershopId: appointmentData.barbershop_id,
      barbershopSlug: barbershopSlug,
      customerName: appointmentData.customer_name,
      customerPhone: appointmentData.customer_phone,
      scheduledAt: appointmentData.scheduled_at,
      serviceName: serviceName,
    });
  } catch (whatsappError) {
    console.error('Erro ao enviar WhatsApp:', whatsappError);
  }
}
```

---

## 🎯 Diferenças

### Antes
```
❌ *Agendamento Reagendado!*

Olá *João*!

Seu agendamento foi reagendado com sucesso:
...
```

### Depois
```
✅ 📢 Olá *João*, informamos que seu *agendamento* para Corte + Barba às 14:30 foi cancelado.

Caso queira *agendar outro horário*, clique no link abaixo: 👇
https://zapcorte.com/barbershop/barbearia-do-joao

_Aviso automático - ZapCorte_
```

---

## 📱 Variáveis Usadas

- `{{primeiroNome}}` - Primeiro nome do cliente
- `{{serviceName}}` - Nome do serviço
- `{{horaFormatada}}` - Horário (HH:mm)
- `{{linkBarbeiro}}` - Link da página do barbeiro

---

## 🔍 Quando Envia

### ✅ Envia Quando:
- Barbeiro altera status para `cancelled`
- Clica em "Salvar" ou confirma a ação
- WhatsApp está conectado

### ❌ NÃO Envia Quando:
- Apenas altera o select (sem salvar)
- WhatsApp não está conectado
- Erro na busca de dados

---

## 🎨 Fluxo Completo

```
1. Barbeiro seleciona agendamento
2. Altera status para "Cancelado"
3. Clica em "Salvar" ou confirma
4. Sistema busca dados completos
5. Atualiza status no banco
6. Envia mensagem WhatsApp com link
7. Mostra notificação de sucesso
8. Atualiza lista de agendamentos
```

---

## 🔐 Segurança

### Validações
- ✅ Verifica se WhatsApp está conectado
- ✅ Valida dados do agendamento
- ✅ Tratamento de erros robusto
- ✅ Não bloqueia cancelamento se WhatsApp falhar

### Logs
```typescript
console.log('[WhatsApp] Enviando cancelamento:', {
  sessionId,
  customerPhone,
  customerName,
  linkBarbeiro
});
```

---

## 🧪 Teste

### Cenário 1: Cancelamento com WhatsApp Conectado
```
1. Barbeiro cancela agendamento
2. Status atualizado para 'cancelled'
3. Cliente recebe mensagem com link
4. Notificação: "Cliente notificado via WhatsApp"
```

### Cenário 2: Cancelamento sem WhatsApp
```
1. Barbeiro cancela agendamento
2. Status atualizado para 'cancelled'
3. WhatsApp não conectado (falha silenciosa)
4. Notificação: "Status atualizado, mas não foi possível enviar WhatsApp"
```

---

## 📊 Benefícios

1. ✅ **Link Direto**: Cliente pode reagendar com 1 clique
2. ✅ **Mensagem Clara**: Formato simples e direto
3. ✅ **Não Configurável**: Mensagem fixa no código (não depende do Supabase)
4. ✅ **Confiável**: Envia apenas quando salva, não ao alterar

---

**Data:** 14 de Novembro de 2025  
**Status:** ✅ Implementado e corrigido  
**Arquivos Modificados:**
- `src/lib/notifications.ts` (nova função)
- `src/pages/Dashboard.tsx` (usa nova função)
- `src/pages/Appointments.tsx` (usa nova função)
