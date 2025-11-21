# Correção: Refresh do Calendário e Barbeiro Null no WhatsApp

## Problema Identificado

Dois problemas foram identificados e corrigidos:

### 1. Calendário não atualizava após alterações
Quando o barbeiro alterava o status ou excluía um agendamento pelo modal do DayCalendar no Dashboard, o card permanecia igual. Era necessário trocar de página ou reabrir o app para ver as mudanças.

**Causa**: O estado `calendarAppointments` não era atualizado após as operações de salvar ou excluir, pois o `useEffect` que busca os agendamentos só era executado quando `barbershop?.id` ou `calendarDate` mudavam.

### 2. Barbeiro aparecia como "null" nas mensagens do WhatsApp
Quando o barbeiro confirmava um agendamento no plano PRO, a mensagem enviada via WhatsApp mostrava "Barbeiro: null" em vez do nome do barbeiro.

**Causa**: 
- O `appointmentId` não estava sendo passado para a função `enviarLembreteWhatsApp`
- A função não tratava corretamente quando o barbeiro retornava como `null`

## Correções Aplicadas

### 1. Dashboard.tsx

#### Extração da função de busca de agendamentos
Transformei o código dentro do `useEffect` em uma função reutilizável `fetchCalendarAppointments()`:

```typescript
// Função para buscar agendamentos do calendário
const fetchCalendarAppointments = async () => {
  if (!barbershop?.id) return;
  
  try {
    const startOfDay = new Date(calendarDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(calendarDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services (name, duration),
        barbers (id, name)
      `)
      .eq("barbershop_id", barbershop.id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true });
    
    if (error) throw error;
    
    setCalendarAppointments(data?.map(apt => ({
      ...apt,
      service_name: apt.services?.name,
      service_duration: apt.services?.duration,
      barber_id: apt.barbers?.id,
      barber_name: apt.barbers?.name
    })) || []);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    setCalendarAppointments([]);
  }
};
```

#### Atualização após salvar alterações
Na função `saveAllChanges()`, adicionei chamada para atualizar o calendário:

```typescript
// Atualizar dados do dashboard e calendário
await Promise.all([
  refetchDashboard(),
  fetchCalendarAppointments()
]);
closeViewModal();
```

#### Atualização após excluir agendamento
Na função `deleteAppointment()`, adicionei chamada para atualizar o calendário:

```typescript
// Atualizar dados do dashboard e calendário
await Promise.all([
  refetchDashboard(),
  fetchCalendarAppointments()
]);
closeViewModal();
```

#### Atualização após criar encaixe
Na função `handleFitInSubmitDashboard()`, adicionei atualização do calendário:

```typescript
closeNewAppointmentModal();
// Aguardar e forçar atualização
setTimeout(async () => {
  await Promise.all([
    refetchDashboard(),
    fetchCalendarAppointments()
  ]);
}, 300);
```

#### Passagem do appointmentId para notificações
Adicionei o `appointmentId` nas chamadas de notificação:

```typescript
// Para confirmação
await enviarLembreteWhatsApp({
  barbershopId: originalData.barbershop_id,
  customerName: originalData.customer_name,
  customerPhone: originalData.customer_phone,
  scheduledAt: scheduledAt.toISOString(),
  serviceName: serviceName,
  tipo: 'confirmacao',
  appointmentId: selectedAppointment.id, // ✅ Adicionado
});

// Para cancelamento
await enviarCancelamentoWhatsApp({
  barbershopId: originalData.barbershop_id,
  barbershopSlug: barbershopSlug,
  customerName: originalData.customer_name,
  customerPhone: originalData.customer_phone,
  scheduledAt: scheduledAt.toISOString(),
  serviceName: serviceName,
  appointmentId: selectedAppointment.id, // ✅ Adicionado
});
```

### 2. notifications.ts

#### Tratamento correto do nome do barbeiro
Modifiquei a lógica para buscar e validar o nome do barbeiro:

```typescript
// Buscar nome do barbeiro APENAS se for plano PRO e appointmentId foi fornecido
const isPro = barbershop.plan_type === 'pro';
let barbeiroNome: string | null = null;

if (isPro && appointmentId) {
  const nome = await getBarberName(appointmentId, barbershopId);
  // Só usar o nome se não for a mensagem padrão
  barbeiroNome = (nome && nome !== 'Qualquer barbeiro disponível') ? nome : null;
}
```

**Mudanças**:
- Mudou de `const` para `let` para permitir validação
- Verifica se o nome retornado não é a mensagem padrão
- Define como `null` se não houver barbeiro específico
- Isso garante que as mensagens usem a versão sem barbeiro quando apropriado

## Resultado

### Problema 1 - Refresh do Calendário
✅ **Resolvido**: O calendário agora atualiza imediatamente após:
- Salvar alterações de status ou data/hora
- Excluir um agendamento
- Criar um novo encaixe

### Problema 2 - Barbeiro Null no WhatsApp
✅ **Resolvido**: As mensagens do WhatsApp agora mostram:
- Nome do barbeiro quando há um barbeiro específico atribuído (plano PRO)
- Versão da mensagem sem menção ao barbeiro quando não há barbeiro específico
- Nunca mais aparece "Barbeiro: null"

## Arquivos Modificados

1. `src/pages/Dashboard.tsx`
   - Extraída função `fetchCalendarAppointments()`
   - Adicionadas chamadas de refresh após operações
   - Adicionado `appointmentId` nas notificações

2. `src/lib/notifications.ts`
   - Melhorado tratamento do nome do barbeiro
   - Validação para evitar "null" nas mensagens

## Teste

Para testar as correções:

1. **Teste de Refresh**:
   - Abra o Dashboard
   - Clique em um agendamento no calendário
   - Altere o status ou exclua o agendamento
   - Verifique se o calendário atualiza imediatamente

2. **Teste de Barbeiro no WhatsApp**:
   - Crie um agendamento no plano PRO
   - Confirme o agendamento pelo Dashboard
   - Verifique a mensagem do WhatsApp
   - O nome do barbeiro deve aparecer corretamente (ou a mensagem sem barbeiro se não houver um específico)

## Data da Correção
21/11/2025
