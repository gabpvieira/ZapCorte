# ⏰ Validação de Horários Passados no Painel do Barbeiro

## 📋 Problema

Quando o barbeiro cria um agendamento pelo painel, o sistema permitia selecionar horários que já passaram, diferente do comportamento quando o cliente agenda.

---

## ✅ Solução Implementada

Adicionada validação na função `getAvailableTimeSlots` para bloquear horários passados, aplicando a mesma lógica tanto para:
- ✅ Agendamentos feitos pelo cliente
- ✅ Agendamentos feitos pelo barbeiro no painel

---

## 🔧 Implementação

### Arquivo Modificado
`src/lib/supabase-queries.ts`

### Código Adicionado
```typescript
// Obter hora atual no timezone brasileiro
const now = new Date();
const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

while (new Date(cursor.getTime() + serviceDuration * 60000) <= workEnd) {
  const slotStart = new Date(cursor);
  const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

  // Verificar se o horário já passou (não permitir agendamento no passado)
  const isPastTime = slotStart <= nowBrazil;

  // Verificar colisão com períodos ocupados (agendamento + pausa no atendimento existente)
  let available = true;
  
  // Se o horário já passou, marcar como indisponível
  if (isPastTime) {
    available = false;
  } else {
    // Verificar colisão com períodos ocupados
    for (const busy of mergedBusyPeriods) {
      if (slotStart < busy.end && slotEnd > busy.start) {
        available = false;
        break;
      }
    }
  }

  slots.push({ time: slotStart.toTimeString().slice(0, 5), available });
  // ...
}
```

---

## 🎯 Comportamento

### Antes
```
Hoje às 14:30 (hora atual)

Horários disponíveis:
✅ 09:00 (permitido - ERRADO!)
✅ 10:00 (permitido - ERRADO!)
✅ 11:00 (permitido - ERRADO!)
✅ 12:00 (permitido - ERRADO!)
✅ 13:00 (permitido - ERRADO!)
✅ 14:00 (permitido - ERRADO!)
✅ 15:00 (permitido)
✅ 16:00 (permitido)
```

### Depois
```
Hoje às 14:30 (hora atual)

Horários disponíveis:
❌ 09:00 (bloqueado - horário passou)
❌ 10:00 (bloqueado - horário passou)
❌ 11:00 (bloqueado - horário passou)
❌ 12:00 (bloqueado - horário passou)
❌ 13:00 (bloqueado - horário passou)
❌ 14:00 (bloqueado - horário passou)
✅ 15:00 (disponível)
✅ 16:00 (disponível)
```

---

## 🌍 Timezone

A validação usa o timezone brasileiro (`America/Sao_Paulo`) para garantir precisão:

```typescript
const now = new Date();
const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
```

Isso garante que:
- ✅ Horário de verão é respeitado
- ✅ Comparação é feita no timezone correto
- ✅ Funciona independente do timezone do servidor

---

## 🔍 Lógica de Validação

### 1. **Obter Hora Atual**
```typescript
const nowBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
```

### 2. **Verificar se Passou**
```typescript
const isPastTime = slotStart <= nowBrazil;
```

### 3. **Marcar como Indisponível**
```typescript
if (isPastTime) {
  available = false;
}
```

### 4. **Verificar Conflitos (se não passou)**
```typescript
else {
  for (const busy of mergedBusyPeriods) {
    if (slotStart < busy.end && slotEnd > busy.start) {
      available = false;
      break;
    }
  }
}
```

---

## 📱 Onde Aplica

Esta validação afeta:

### 1. **Dashboard - Novo Agendamento**
- Modal de criar agendamento rápido
- Seleção de horário para cliente

### 2. **Página de Agendamentos**
- Criação de novo agendamento
- Reagendamento de horários

### 3. **Calendário Semanal**
- Clique em horário vazio
- Criação rápida de agendamento

### 4. **Agendamento Público (Cliente)**
- Página de agendamento do cliente
- Seleção de horário disponível

---

## 🧪 Testes

### Cenário 1: Dia Atual
```
Hora atual: 14:30
Data selecionada: Hoje

Resultado esperado:
- Horários antes de 14:30: ❌ Bloqueados
- Horários após 14:30: ✅ Disponíveis (se não ocupados)
```

### Cenário 2: Dia Futuro
```
Hora atual: 14:30
Data selecionada: Amanhã

Resultado esperado:
- Todos os horários: ✅ Disponíveis (se não ocupados)
```

### Cenário 3: Horário Limite
```
Hora atual: 14:29
Horário: 14:30

Resultado esperado:
- 14:30: ✅ Disponível (ainda não passou)

Hora atual: 14:30
Horário: 14:30

Resultado esperado:
- 14:30: ❌ Bloqueado (já passou)
```

---

## ⚠️ Considerações

### Precisão
- Comparação usa `<=` (menor ou igual)
- Horário exato da hora atual é bloqueado
- Apenas horários futuros são permitidos

### Performance
- Validação é feita uma vez por slot
- Não impacta performance significativamente
- Cálculo de timezone é otimizado

### Consistência
- Mesma lógica para cliente e barbeiro
- Evita agendamentos inválidos
- Melhora experiência do usuário

---

## 🎨 UI/UX

### Visual
- Horários passados aparecem desabilitados
- Mesma aparência de horários ocupados
- Não são clicáveis

### Feedback
- Usuário não consegue selecionar
- Evita erro de validação posterior
- Experiência mais fluida

---

## 📝 Benefícios

1. ✅ **Consistência**: Mesma regra para todos os fluxos
2. ✅ **Prevenção**: Evita agendamentos inválidos
3. ✅ **UX**: Feedback visual imediato
4. ✅ **Confiabilidade**: Validação no backend
5. ✅ **Timezone**: Respeita horário brasileiro

---

**Data:** 14 de Novembro de 2025  
**Status:** ✅ Implementado e testado  
**Arquivo:** `src/lib/supabase-queries.ts`
