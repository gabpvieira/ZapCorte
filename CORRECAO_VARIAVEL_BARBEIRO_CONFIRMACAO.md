# Correção: Variável {barbeiro} em Mensagens de Confirmação

## 🐛 Problema Identificado

Quando o barbeiro confirmava um agendamento pela página "Meus Agendamentos", a variável `{barbeiro}` estava sendo substituída por "Qualquer barbeiro disponível" mesmo em contas com plano PRO que deveriam mostrar o nome específico do barbeiro.

## 🔍 Causa Raiz

A função `getBarberName()` em `src/lib/notifications.ts` estava usando uma query com relacionamento que não funcionava corretamente:

```typescript
// ❌ ANTES - Query com relacionamento que falhava
const { data: appointment } = await supabase
  .from('appointments')
  .select('barber_id, barbers!appointments_barber_id_fkey(name)')
  .eq('id', appointmentId)
  .single();
```

Quando o relacionamento falhava ou retornava dados em formato inesperado, a função retornava o fallback "Qualquer barbeiro disponível".

## ✅ Solução Implementada

### 1. Refatoração da função `getBarberName()`

Refatorada a função `getBarberName()` para fazer duas queries separadas e mais robustas:

### 1. Buscar o Appointment
```typescript
const { data: appointment, error: appointmentError } = await supabase
  .from('appointments')
  .select('barber_id, barbershop_id')
  .eq('id', appointmentId)
  .single();
```

### 2. Buscar o Barbeiro pelo ID
```typescript
const { data: barber, error: barberError } = await supabase
  .from('barbers')
  .select('name')
  .eq('id', appointment.barber_id)
  .single();
```

### 2. Correção na chamada de `enviarLembreteWhatsApp()`

Na função `handleAcceptAppointment()` em `Appointments.tsx`, o `appointmentId` não estava sendo passado:

```typescript
// ❌ ANTES - appointmentId não era passado
const mensagemEnviada = await enviarLembreteWhatsApp({
  barbershopId: barbershop.id,
  customerName: appointment.customer_name,
  customerPhone: appointment.customer_phone,
  scheduledAt: appointment.scheduled_at,
  serviceName: appointment.service?.name || 'Serviço',
  tipo: 'confirmacao',
  // appointmentId estava faltando!
});

// ✅ DEPOIS - appointmentId agora é passado
const mensagemEnviada = await enviarLembreteWhatsApp({
  barbershopId: barbershop.id,
  customerName: appointment.customer_name,
  customerPhone: appointment.customer_phone,
  scheduledAt: appointment.scheduled_at,
  serviceName: appointment.service?.name || 'Serviço',
  tipo: 'confirmacao',
  appointmentId: appointment.id, // ✅ Agora passa o ID
});
```

### 3. Logs Detalhados
Adicionados logs em cada etapa para facilitar debug:
- Log ao iniciar busca
- Log do barber_id encontrado
- Log do nome do barbeiro
- Logs de erro em cada etapa

## 🎯 Comportamento Corrigido

### Plano PRO
- ✅ Mostra o nome específico do barbeiro (ex: "Carlos Silva")
- ✅ Mensagem personalizada: "Carlos Silva te espera!"
- ✅ Funciona em todas as mensagens: confirmação, reagendamento, lembrete

### Plano FREE
- ✅ Mostra "Qualquer barbeiro disponível" (comportamento esperado)
- ✅ Mensagem genérica: "Nos vemos em breve!"

## 📝 Código Completo da Função

```typescript
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
```

## 🔄 Fluxo de Substituição de Variáveis

A função `substituirVariaveis()` substitui todas as variáveis na mensagem:

```typescript
const substituirVariaveis = (template: string) => {
  return template
    .replace(/\{\{primeiro_nome\}\}/g, primeiroNome)
    .replace(/\{\{servico\}\}/g, serviceName)
    .replace(/\{\{data\}\}/g, dataFormatada)
    .replace(/\{\{hora\}\}/g, horaFormatada)
    .replace(/\{\{barbearia\}\}/g, barbershop.name)
    .replace(/\{\{barbeiro\}\}/g, barbeiroNome)  // ✅ Agora com nome correto
    .replace(/\{\{dia_semana\}\}/g, diaSemana);
};
```

## 🧪 Como Testar

1. **Criar um agendamento** na página pública da barbearia
2. **Confirmar o agendamento** pela página "Meus Agendamentos" (painel do barbeiro)
3. **Verificar a mensagem** enviada ao cliente no WhatsApp
4. **Conferir** se o nome do barbeiro aparece corretamente

### Exemplo de Mensagem Esperada (Plano PRO)

```
✅ Agendamento Confirmado!

Olá João!

Seu agendamento foi confirmado:

👤 Barbeiro: Carlos Silva
📅 Data: Segunda-feira, 15/11/2024
🕐 Horário: 14:30
✂️ Serviço: Corte + Barba
🏪 Local: Barbearia Premium

Carlos Silva te espera! 💈

Mensagem enviada automaticamente pelo ZapCorte
```

## 📊 Impacto

### Antes
- ❌ Todas as mensagens mostravam "Qualquer barbeiro disponível"
- ❌ Experiência genérica mesmo no plano PRO
- ❌ Valor do plano PRO não era percebido

### Depois
- ✅ Mensagens personalizadas com nome do barbeiro (PRO)
- ✅ Experiência profissional e personalizada
- ✅ Valor do plano PRO claramente demonstrado

## 🔗 Arquivos Alterados

- `src/lib/notifications.ts` - Função `getBarberName()` refatorada
- `src/pages/Appointments.tsx` - Função `handleAcceptAppointment()` agora passa `appointmentId`

## 📌 Observações

- A função mantém o fallback "Qualquer barbeiro disponível" para casos onde:
  - O appointment não tem `barber_id` definido
  - O barbeiro não é encontrado no banco
  - Ocorre algum erro na busca
- Logs detalhados facilitam debug em produção
- Compatível com planos FREE e PRO

## ✨ Status
✅ Implementado e testado
✅ Logs de debug adicionados
✅ Fallback seguro mantido
✅ Compatível com todos os tipos de mensagem
