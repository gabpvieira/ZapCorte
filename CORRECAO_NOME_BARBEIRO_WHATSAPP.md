# Correção: Nome do Barbeiro Null no WhatsApp

## 🐛 Problema Identificado

Quando um agendamento manual era criado com **atribuição automática** de barbeiro (Plano PRO), o sistema atribuía corretamente o barbeiro ao agendamento, mas a mensagem de confirmação enviada via WhatsApp mostrava o nome do barbeiro como **null**.

### Exemplo do Bug
```
✅ Agendamento Confirmado!

Olá João!

Seu agendamento foi confirmado:

👤 Barbeiro: null  ❌ (deveria mostrar o nome)
📅 Data: Segunda-feira, 20/11/2024
🕐 Horário: 14:00
✂️ Serviço: Corte Masculino
```

## 🔍 Causa Raiz

O problema estava em duas partes:

### 1. Falta do `appointmentId` na chamada
No componente `NewAppointmentModal.tsx`, quando o agendamento era criado, a função `enviarLembreteWhatsApp` era chamada **sem** passar o `appointmentId`:

```typescript
// ❌ ANTES (Incorreto)
await createAppointment({...});

await enviarLembreteWhatsApp({
  barbershopId,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  tipo: 'confirmacao',
  // appointmentId não era passado ❌
});
```

### 2. Função `getBarberName` não conseguia buscar o barbeiro
A função `getBarberName` em `notifications.ts` precisa do `appointmentId` para:
1. Buscar o appointment no banco
2. Pegar o `barber_id` do appointment
3. Buscar o nome do barbeiro na tabela `barbers`

Sem o `appointmentId`, a função retornava "Qualquer barbeiro disponível" como fallback.

## ✅ Solução Implementada

### 1. Capturar o ID do agendamento criado
Modificado para capturar o retorno de `createAppointment`:

```typescript
// ✅ DEPOIS (Correto)
const newAppointment = await createAppointment({
  barbershop_id: barbershopId,
  service_id: selectedService,
  customer_name: customerName,
  customer_phone: customerPhone,
  scheduled_at: scheduledAt,
  status: 'confirmed',
  is_fit_in: isFitIn,
  ...(finalBarberId && { barber_id: finalBarberId })
});
```

### 2. Passar o `appointmentId` para a função de WhatsApp
```typescript
await enviarLembreteWhatsApp({
  barbershopId,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName,
  tipo: 'confirmacao',
  appointmentId: newAppointment?.id, // ✅ Agora passa o ID
});
```

### 3. Fluxo Completo
1. Agendamento é criado com `barber_id` (atribuição automática ou manual)
2. `appointmentId` é capturado
3. `appointmentId` é passado para `enviarLembreteWhatsApp`
4. Função `getBarberName` busca o appointment pelo ID
5. Pega o `barber_id` do appointment
6. Busca o nome do barbeiro na tabela `barbers`
7. Nome correto é inserido na mensagem do WhatsApp ✅

## 📝 Arquivos Modificados

### `src/components/NewAppointmentModal.tsx`
- Captura o retorno de `createAppointment` em ambos os fluxos (normal e encaixe)
- Passa `appointmentId` para `enviarLembreteWhatsApp`

## 🧪 Como Testar

1. Acesse uma conta com Plano PRO
2. Vá em "Agendamentos" → "Novo Agendamento"
3. Preencha os dados do cliente
4. Selecione um serviço
5. Escolha "Atribuição Automática" (não selecione barbeiro específico)
6. Selecione data e horário
7. Crie o agendamento
8. Verifique a mensagem no WhatsApp do cliente
9. O nome do barbeiro deve aparecer corretamente ✅

## ✨ Resultado

### Antes (Bug)
```
👤 Barbeiro: null
```

### Depois (Corrigido)
```
👤 Barbeiro: João Silva
```

## 🎯 Impacto

**Apenas Plano PRO**: Esta correção afeta apenas usuários do Plano PRO que utilizam múltiplos barbeiros e atribuição automática. O Plano Starter/Freemium não mostra o nome do barbeiro nas mensagens.

## 📌 Observações

- A função `getBarberName` já tinha a lógica correta implementada
- O problema era apenas a falta de passar o `appointmentId`
- Agora funciona tanto para atribuição automática quanto manual
- Mensagens de confirmação, lembrete e cancelamento todas usam a mesma função

---

**Data**: 20/11/2024
**Versão**: 2.4.2
**Tipo**: Correção (PATCH)
