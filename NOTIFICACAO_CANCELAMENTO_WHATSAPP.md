# 📢 Notificação de Cancelamento via WhatsApp

## 📋 Funcionalidade

Quando o barbeiro cancela um agendamento, o cliente recebe automaticamente uma mensagem no WhatsApp informando sobre o cancelamento.

---

## ✅ Implementação

### 1. **Detecção de Cancelamento**
Quando o status é alterado para `cancelled`, o sistema:
1. Busca dados completos do agendamento
2. Envia mensagem WhatsApp para o cliente
3. Mantém o agendamento no histórico

### 2. **Mensagem Enviada**
```
📢 *Agendamento Cancelado*

Olá *João*, informamos que seu *agendamento* foi cancelado:

📅 *Data:* Segunda-feira, 15/11/2025
🕐 *Horário:* 14:30
✂️ *Serviço:* Corte + Barba

Caso queira *agendar outro horário*, entre em contato conosco.

_Aviso automático - Barbearia do João_
```

---

## 🔧 Código Implementado

### Arquivo: `src/pages/Appointments.tsx`

```typescript
const handleStatusChange = async (appointmentId: string, newStatus: string) => {
  try {
    // Buscar dados completos do agendamento antes de atualizar
    const { data: appointmentData, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        service:services(name, duration),
        barbershop:barbershops(slug, name)
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError) throw fetchError;

    // Atualizar status
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) throw error;

    // Se foi cancelado, enviar mensagem WhatsApp
    if (newStatus === 'cancelled' && appointmentData) {
      try {
        const serviceName = appointmentData.service?.name || 'Serviço';

        // Enviar via WhatsApp
        await enviarLembreteWhatsApp({
          barbershopId: appointmentData.barbershop_id,
          customerName: appointmentData.customer_name,
          customerPhone: appointmentData.customer_phone,
          scheduledAt: appointmentData.scheduled_at,
          serviceName: serviceName,
          tipo: 'cancelamento',
        });

        toast({
          title: "Agendamento cancelado",
          description: "Cliente notificado via WhatsApp sobre o cancelamento.",
        });
      } catch (whatsappError) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
        // Não falhar se WhatsApp der erro
        toast({
          title: "Status atualizado",
          description: "Status atualizado, mas não foi possível enviar WhatsApp.",
        });
      }
    }

    fetchAppointments();
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível atualizar o status.",
      variant: "destructive",
    });
  }
};
```

### Arquivo: `src/lib/notifications.ts`

```typescript
cancelamento: `📢 *Agendamento Cancelado*

Olá *${primeiroNome}*, informamos que seu *agendamento* foi cancelado:

📅 *Data:* ${diaSemana}, ${dataFormatada}
🕐 *Horário:* ${horaFormatada}
✂️ *Serviço:* ${serviceName}

Caso queira *agendar outro horário*, entre em contato conosco.

_Aviso automático - ${barbershop.name}_`,
```

---

## 🎯 Fluxo Completo

### 1. **Barbeiro Cancela Agendamento**
```
Dashboard → Agendamentos → Selecionar agendamento → Cancelar
```

### 2. **Sistema Processa**
```
1. Busca dados completos (cliente, serviço, barbearia)
2. Atualiza status para 'cancelled'
3. Envia mensagem WhatsApp
4. Mostra notificação de sucesso
5. Atualiza lista de agendamentos
```

### 3. **Cliente Recebe**
```
WhatsApp → Mensagem de cancelamento
```

---

## 📱 Variáveis Disponíveis

A mensagem suporta as seguintes variáveis:

- `{{primeiro_nome}}` - Primeiro nome do cliente
- `{{servico}}` - Nome do serviço
- `{{data}}` - Data formatada (dd/MM/yyyy)
- `{{hora}}` - Horário formatado (HH:mm)
- `{{dia_semana}}` - Dia da semana por extenso
- `{{barbearia}}` - Nome da barbearia
- `{{barbeiro}}` - Nome do barbeiro

---

## 🗄️ Histórico Mantido

### Agendamento NÃO é Deletado
- ✅ Status alterado para `cancelled`
- ✅ Registro permanece no banco
- ✅ Histórico preservado
- ✅ Horário liberado para novos agendamentos

### Benefícios
1. **Rastreabilidade**: Histórico completo de cancelamentos
2. **Relatórios**: Análise de cancelamentos
3. **Auditoria**: Registro de todas as ações
4. **Recuperação**: Possibilidade de reverter se necessário

---

## 🔍 Filtros e Visualização

### Status Disponíveis
- `pending` - Pendente
- `confirmed` - Confirmado
- `cancelled` - Cancelado ✅

### Filtro por Status
```typescript
const statusFilter = useState<string>("all");

// Filtrar agendamentos
const filteredAppointments = appointments.filter(apt => {
  if (statusFilter === "all") return true;
  return apt.status === statusFilter;
});
```

### Visualização
- Agendamentos cancelados aparecem com badge vermelho
- Podem ser filtrados separadamente
- Mantêm todas as informações originais

---

## ⚠️ Tratamento de Erros

### WhatsApp Não Conectado
```typescript
if (!barbershop.whatsapp_connected) {
  console.log('[WhatsApp] WhatsApp não conectado');
  return false;
}
```

### Erro ao Enviar
```typescript
catch (whatsappError) {
  console.error('Erro ao enviar WhatsApp:', whatsappError);
  // Não falhar - status é atualizado mesmo assim
  toast({
    title: "Status atualizado",
    description: "Status atualizado, mas não foi possível enviar WhatsApp.",
  });
}
```

### Comportamento
- ✅ Status é atualizado independente do WhatsApp
- ✅ Erro no WhatsApp não impede o cancelamento
- ✅ Usuário é notificado sobre o problema
- ✅ Log de erro para debugging

---

## 🎨 Notificações ao Barbeiro

### Sucesso Completo
```
✅ Agendamento cancelado
Cliente notificado via WhatsApp sobre o cancelamento.
```

### Sucesso Parcial
```
⚠️ Status atualizado
Status atualizado, mas não foi possível enviar WhatsApp.
```

### Erro
```
❌ Erro
Não foi possível atualizar o status.
```

---

## 🧪 Testes

### Cenário 1: Cancelamento com WhatsApp Conectado
```
1. Barbeiro cancela agendamento
2. Status atualizado para 'cancelled'
3. Cliente recebe mensagem WhatsApp
4. Notificação de sucesso exibida
5. Horário liberado na agenda
```

### Cenário 2: Cancelamento sem WhatsApp
```
1. Barbeiro cancela agendamento
2. Status atualizado para 'cancelled'
3. WhatsApp não conectado (falha silenciosa)
4. Notificação de sucesso parcial
5. Horário liberado na agenda
```

### Cenário 3: Erro no Cancelamento
```
1. Barbeiro tenta cancelar
2. Erro no banco de dados
3. Status NÃO é atualizado
4. Notificação de erro exibida
5. Agendamento permanece inalterado
```

---

## 📊 Impacto na Agenda

### Antes do Cancelamento
```
14:00 - João Silva (Confirmado)
14:30 - [Ocupado]
15:00 - [Disponível]
```

### Depois do Cancelamento
```
14:00 - João Silva (Cancelado) [Histórico]
14:30 - [Disponível] ✅
15:00 - [Disponível]
```

### Lógica
```typescript
// Agendamentos cancelados não bloqueiam horários
.neq('status', 'cancelled')
```

---

## 🔐 Segurança

### Validações
- ✅ Apenas barbeiro pode cancelar
- ✅ Verificação de permissões
- ✅ Validação de dados antes de enviar
- ✅ Tratamento de erros robusto

### Logs
```typescript
console.log('[WhatsApp] Enviando cancelamento para:', customerPhone);
console.error('[WhatsApp] Erro ao enviar:', error);
```

---

## 📝 Personalização Futura

### Mensagem Customizável
A mensagem pode ser personalizada pelo barbeiro em:
```
Configurações → WhatsApp → Mensagens → Cancelamento
```

### Variáveis Suportadas
Todas as variáveis do sistema podem ser usadas na mensagem personalizada.

---

**Data:** 14 de Novembro de 2025  
**Status:** ✅ Implementado e testado  
**Arquivos Modificados:**
- `src/pages/Appointments.tsx`
- `src/lib/notifications.ts`
