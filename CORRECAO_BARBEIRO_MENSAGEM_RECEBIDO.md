# Correção: Nome do Barbeiro na Mensagem de Agendamento Recebido

**Data**: 19/11/2025  
**Tipo**: Correção de Bug  
**Status**: ✅ Resolvido

---

## 🐛 Problema

Ao selecionar um barbeiro específico na página pública de agendamento, a mensagem de "Agendamento Recebido" enviada via WhatsApp estava mostrando "Qualquer barbeiro disponível" em vez do nome do barbeiro selecionado.

---

## 🔍 Causa Raiz

A função `notificarNovoAgendamento` não estava recebendo o `appointmentId` como parâmetro, então a função `enviarMensagemAgendamentoRecebido` não conseguia buscar o nome do barbeiro associado ao agendamento.

**Fluxo com problema:**
```
Booking.tsx (cria agendamento)
  ↓
createAppointment() (retorna agendamento com ID)
  ↓
notificarNovoAgendamento() ❌ (sem appointmentId)
  ↓
enviarMensagemAgendamentoRecebido() ❌ (sem appointmentId)
  ↓
getBarberName() ❌ (não consegue buscar)
  ↓
Resultado: "Qualquer barbeiro disponível"
```

---

## ✅ Solução Aplicada

### 1. Atualizada assinatura de `notificarNovoAgendamento`

**Antes**:
```typescript
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
```

**Depois**:
```typescript
export async function notificarNovoAgendamento({
  barbershopId,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName,
  appointmentId, // ✅ Novo parâmetro
}: {
  barbershopId: string;
  customerName: string;
  scheduledAt: string;
  customerPhone?: string;
  serviceName?: string;
  appointmentId?: string; // ✅ Novo parâmetro
}) {
```

### 2. Passado `appointmentId` para `enviarMensagemAgendamentoRecebido`

**Antes**:
```typescript
await enviarMensagemAgendamentoRecebido({
  barbershopId,
  barbershopName: barbershop.name,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName: serviceName || 'Serviço',
});
```

**Depois**:
```typescript
await enviarMensagemAgendamentoRecebido({
  barbershopId,
  barbershopName: barbershop.name,
  customerName,
  customerPhone,
  scheduledAt,
  serviceName: serviceName || 'Serviço',
  appointmentId, // ✅ Passando o ID
});
```

### 3. Capturado ID do agendamento em `Booking.tsx`

**Antes**:
```typescript
await createAppointment({
  barbershop_id: barbershop.id,
  service_id: service.id,
  barber_id: selectedBarberId || undefined,
  customer_name: customerName,
  customer_phone: customerPhone,
  scheduled_at: scheduledAt,
  status: 'pending'
});

// ...

await notificarNovoAgendamento({
  barbershopId: barbershop.id,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName: service.name,
});
```

**Depois**:
```typescript
const newAppointment = await createAppointment({ // ✅ Capturando retorno
  barbershop_id: barbershop.id,
  service_id: service.id,
  barber_id: selectedBarberId || undefined,
  customer_name: customerName,
  customer_phone: customerPhone,
  scheduled_at: scheduledAt,
  status: 'pending'
});

// ...

await notificarNovoAgendamento({
  barbershopId: barbershop.id,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName: service.name,
  appointmentId: newAppointment?.id, // ✅ Passando o ID
});
```

---

## 🔄 Fluxo Corrigido

```
Booking.tsx (cria agendamento)
  ↓
createAppointment() (retorna agendamento com ID)
  ↓
newAppointment.id capturado ✅
  ↓
notificarNovoAgendamento(appointmentId) ✅
  ↓
enviarMensagemAgendamentoRecebido(appointmentId) ✅
  ↓
getBarberName(appointmentId) ✅
  ↓
Busca no banco: barbers.name ✅
  ↓
Resultado: "Carlos Silva" ✅
```

---

## 📝 Arquivos Modificados

1. **`src/lib/notifications.ts`**
   - Adicionado parâmetro `appointmentId` em `notificarNovoAgendamento`
   - Passado `appointmentId` para `enviarMensagemAgendamentoRecebido`

2. **`src/pages/Booking.tsx`**
   - Capturado retorno de `createAppointment`
   - Passado `appointmentId` para `notificarNovoAgendamento`

---

## ✅ Resultado

### Antes da Correção
```
✂️ AGENDAMENTO RECEBIDO!

Opa, João! 👋
Seu agendamento foi feito com sucesso:

👤 Barbeiro: Qualquer barbeiro disponível ❌
📆 Data: Segunda-feira, 19/11/2025
⏰ Horário: 14:30
💈 Serviço: Corte + Barba

⏳ Aguardando confirmação do barbeiro.
```

### Depois da Correção
```
✂️ AGENDAMENTO RECEBIDO!

Opa, João! 👋
Seu agendamento foi feito com sucesso:

👤 Barbeiro: Carlos Silva ✅
📆 Data: Segunda-feira, 19/11/2025
⏰ Horário: 14:30
💈 Serviço: Corte + Barba

⏳ Aguardando confirmação de Carlos Silva.
```

---

## 🧪 Testes

### Cenário 1: Agendamento com Barbeiro Específico
```
1. Acessar página pública da barbearia
2. Selecionar barbeiro "Carlos Silva"
3. Escolher serviço, data e horário
4. Preencher dados e confirmar
5. ✅ Mensagem deve mostrar: "Barbeiro: Carlos Silva"
```

### Cenário 2: Agendamento sem Barbeiro (Qualquer Um)
```
1. Acessar página pública da barbearia
2. Não selecionar barbeiro específico
3. Escolher serviço, data e horário
4. Preencher dados e confirmar
5. ✅ Mensagem deve mostrar: "Barbeiro: Qualquer barbeiro disponível"
```

### Cenário 3: Confirmação pelo Dashboard
```
1. Barbeiro confirma agendamento no dashboard
2. Cliente recebe mensagem de confirmação
3. ✅ Mensagem deve mostrar nome do barbeiro correto
```

---

## 📊 Impacto

- ✅ **Correção de Bug**: Nome do barbeiro agora aparece corretamente
- ✅ **Experiência do Cliente**: Informação precisa sobre quem vai atendê-lo
- ✅ **Sem Breaking Changes**: Funciona com ou sem barbeiro
- ✅ **Retrocompatível**: Agendamentos antigos continuam funcionando

---

**Status**: ✅ CORRIGIDO  
**Testado**: Sim  
**Pronto para**: 🚀 PRODUÇÃO
