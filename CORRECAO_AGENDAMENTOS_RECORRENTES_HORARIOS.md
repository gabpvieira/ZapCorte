# 🔧 Correção: Agendamentos Recorrentes Bloqueando Horários

## 📋 Problema Identificado

Os agendamentos recorrentes não estavam bloqueando os horários na página de agendamento público (Barbershop). 

**Exemplo do problema:**
- Barbeiro cria agendamento recorrente: Cliente João, toda sexta-feira às 14:30
- Na página pública de agendamento, o horário 14:30 continuava aparecendo como disponível
- Isso permitia que outros clientes agendassem no mesmo horário

## 🔍 Causa Raiz

A função `getAvailableTimeSlots` em `src/lib/supabase-queries.ts` estava buscando apenas da tabela `appointments` para verificar horários ocupados, mas **não consultava a tabela `recurring_appointments`**.

Os agendamentos recorrentes ficam armazenados na tabela `recurring_appointments` e servem como "reservas permanentes" de horários. Eles devem bloquear os slots mesmo antes de serem convertidos em agendamentos normais.

## ✅ Solução Implementada

### 1. Modificação na Query

Adicionada uma terceira query paralela para buscar agendamentos recorrentes ativos:

```typescript
const [
  { data: service, error: serviceError }, 
  { data: appointments, error: appointmentsError },
  { data: recurringAppointments, error: recurringError } // ← NOVO
] = await Promise.all([
  // ... query de serviço
  // ... query de appointments normais
  supabase
    .from('recurring_appointments')
    .select('time_of_day, day_of_week, services(duration)')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true)
    .eq('day_of_week', dayOfWeek)
    .lte('start_date', date)
    .or(`end_date.is.null,end_date.gte.${date}`)
]);
```

### 2. Filtros Aplicados

A query de agendamentos recorrentes filtra por:
- ✅ `barbershop_id`: Apenas da barbearia específica
- ✅ `is_active = true`: Apenas recorrentes ativos
- ✅ `day_of_week`: Apenas do dia da semana selecionado
- ✅ `start_date <= date`: Já iniciados
- ✅ `end_date >= date OR end_date IS NULL`: Ainda válidos ou sem data de término

### 3. Bloqueio de Períodos

Os agendamentos recorrentes agora são adicionados aos períodos ocupados:

```typescript
// 3.2. Adicionar agendamentos recorrentes (que reservam o horário fixo)
recurringAppointments?.forEach((recurring: any) => {
  const recurringStart = new Date(`${date}T${recurring.time_of_day}-03:00`);
  const recurringServiceDuration = recurring.services?.duration || 30;
  const recurringEnd = new Date(recurringStart.getTime() + recurringServiceDuration * 60000);
  const recurringEndWithBreak = new Date(recurringEnd.getTime() + breakTime * 60000);
  
  busyPeriods.push({ start: recurringStart, end: recurringEndWithBreak });
});
```

## 🎯 Comportamento Após Correção

### Cenário 1: Agendamento Recorrente Semanal
```
Configuração:
- Cliente: João Silva
- Serviço: Corte Social (30 min)
- Frequência: Semanal
- Dia: Sexta-feira
- Horário: 14:30

Resultado na página de agendamento:
✅ Sexta-feira 14:30 → INDISPONÍVEL (bloqueado)
✅ Sexta-feira 14:00 → DISPONÍVEL
✅ Sexta-feira 15:00 → DISPONÍVEL
```

### Cenário 2: Múltiplos Recorrentes
```
Configuração:
- Cliente A: Segunda 10:00 (Corte 30min)
- Cliente B: Segunda 14:00 (Barba 20min)
- Cliente C: Segunda 16:30 (Corte + Barba 50min)

Resultado na segunda-feira:
❌ 10:00 - BLOQUEADO (Cliente A)
❌ 14:00 - BLOQUEADO (Cliente B)
❌ 16:30 - BLOQUEADO (Cliente C)
✅ Demais horários - DISPONÍVEIS
```

## 🔄 Fluxo Completo

```
1. Cliente acessa página de agendamento
   ↓
2. Seleciona data (ex: sexta-feira 20/12)
   ↓
3. Sistema calcula dia da semana (5 = sexta)
   ↓
4. Busca em paralelo:
   - Agendamentos normais do dia
   - Agendamentos recorrentes ativos para sexta
   ↓
5. Monta lista de períodos ocupados:
   - Agendamentos normais confirmados
   - Horários reservados por recorrentes
   ↓
6. Gera slots disponíveis
   ↓
7. Exibe apenas horários livres
```

## 📊 Impacto

### Antes da Correção
- ❌ Conflitos de horário
- ❌ Duplo agendamento no mesmo slot
- ❌ Clientes recorrentes perdendo seus horários fixos
- ❌ Necessidade de cancelamento manual

### Depois da Correção
- ✅ Horários recorrentes protegidos
- ✅ Sem conflitos de agendamento
- ✅ Clientes recorrentes mantêm seus horários
- ✅ Sistema totalmente automatizado

## 🧪 Como Testar

### Teste 1: Criar Recorrente e Verificar Bloqueio
1. Acesse o painel do barbeiro
2. Vá em "Meus Agendamentos" → Aba "Recorrentes"
3. Crie um agendamento recorrente:
   - Cliente: Teste
   - Serviço: Corte Social
   - Frequência: Semanal
   - Dia: Próxima sexta-feira
   - Horário: 14:30
4. Salve
5. Abra a página pública de agendamento
6. Selecione a próxima sexta-feira
7. **Verificar:** Horário 14:30 deve estar INDISPONÍVEL

### Teste 2: Desativar Recorrente
1. No painel, desative o toggle do recorrente
2. Recarregue a página de agendamento
3. **Verificar:** Horário 14:30 deve voltar a ficar DISPONÍVEL

### Teste 3: Múltiplos Recorrentes
1. Crie 3 agendamentos recorrentes para o mesmo dia
2. Horários: 10:00, 14:00, 16:30
3. Acesse página de agendamento
4. **Verificar:** Todos os 3 horários devem estar bloqueados

## 🔒 Segurança

A correção mantém todas as políticas RLS existentes:
- Apenas agendamentos recorrentes ativos são considerados
- Apenas da barbearia específica
- Respeita datas de início e término
- Não expõe dados sensíveis

## 📝 Observações Importantes

1. **Prioridade dos Recorrentes:** Agendamentos recorrentes têm prioridade sobre agendamentos avulsos
2. **Duração Considerada:** O bloqueio considera a duração do serviço + 5 minutos de pausa
3. **Timezone:** Todos os cálculos usam timezone brasileiro (UTC-3)
4. **Performance:** As 3 queries rodam em paralelo (Promise.all) para máxima eficiência
5. **Logs:** Sistema registra no console quando um recorrente bloqueia um horário

## 🚀 Próximos Passos (Opcional)

1. **Dashboard de Recorrentes:** Mostrar visualmente os horários bloqueados
2. **Notificação:** Avisar barbeiro quando cliente tenta agendar em horário recorrente
3. **Exceções:** Permitir que barbeiro libere um horário recorrente pontualmente
4. **Relatório:** Estatísticas de uso dos agendamentos recorrentes

---

**Status:** ✅ Implementado e Testado
**Data:** 16/11/2025
**Arquivo Modificado:** `src/lib/supabase-queries.ts`
**Função Alterada:** `getAvailableTimeSlots`
