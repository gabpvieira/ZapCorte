# Correção: Horários Disponíveis Após Intervalo de Almoço

## 🐛 Problema Identificado

Ao configurar um intervalo de almoço (ex: 13:00 - 15:00) e selecionar um serviço de 45 minutos, o sistema mostrava o próximo horário disponível às 15:40, quando deveria mostrar 15:00.

### Causa Raiz

O sistema estava gerando horários com um **passo fixo** de `(duração do serviço + 5 minutos de pausa)`:
- Serviço de 45 min + 5 min de pausa = **passo de 50 minutos**
- Isso fazia os horários pularem: 13:00 → 13:50 → 14:40 → 15:30 → ...

Após o almoço terminar às 15:00, o próximo slot calculado seria 15:30, mas arredondado para 15:40.

## ✅ Solução Implementada

Alteramos a lógica de geração de horários para usar um **passo fixo de 5 minutos**, permitindo máxima flexibilidade no agendamento.

### Mudanças Realizadas

#### 1. Função `getAvailableTimeSlots` (Plano Starter/Freemium)

**Antes:**
```typescript
const stepMs = (serviceDuration + breakTime) * 60000; // Passo variável
```

**Depois:**
```typescript
const stepMs = 5 * 60000; // Passo fixo de 5 minutos
```

#### 2. Função `getBarberAvailableTimeSlots` (Plano PRO)

**Antes:**
```typescript
const stepMs = (serviceDuration + breakTime) * 60000; // Passo variável
cursor = new Date(cursor.getTime() + stepMs);
cursor = roundToNext5(cursor); // Arredondamento desnecessário
```

**Depois:**
```typescript
const stepMs = 5 * 60000; // Passo fixo de 5 minutos
cursor = new Date(cursor.getTime() + stepMs); // Sem arredondamento
```

## 🎯 Benefícios

### 1. Horários Mais Flexíveis
- Antes: Horários a cada 50 minutos (para serviço de 45 min)
- Depois: Horários a cada 5 minutos

### 2. Melhor Aproveitamento do Tempo
- Permite agendar imediatamente após o almoço (15:00)
- Não desperdiça slots de tempo disponíveis
- Mais opções para o cliente escolher

### 3. Exemplo Prático

**Configuração:**
- Horário de almoço: 13:00 - 15:00
- Serviço: 45 minutos
- Horário de funcionamento: 09:00 - 18:00

**Antes da correção:**
```
12:10 ✅
13:00 ❌ (almoço)
13:50 ❌ (almoço)
14:40 ❌ (termina às 15:25, cruza com almoço)
15:30 ✅ (arredondado para 15:40)
```

**Depois da correção:**
```
12:55 ✅
13:00 ❌ (almoço)
13:05 ❌ (almoço)
...
14:55 ❌ (termina às 15:40, cruza com almoço)
15:00 ✅ (primeiro horário disponível!)
15:05 ✅
15:10 ✅
...
```

## 🔍 Lógica de Validação

O sistema continua validando corretamente:

1. ✅ **Horários passados**: Não permite agendar no passado
2. ✅ **Agendamentos existentes**: Bloqueia horários ocupados + 5 min de pausa
3. ✅ **Intervalo de almoço**: Bloqueia se o serviço começar OU terminar durante o almoço
4. ✅ **Horário de funcionamento**: Respeita início e fim do expediente
5. ✅ **Agendamentos recorrentes**: Bloqueia horários fixos reservados

## 📝 Arquivos Modificados

- `src/lib/supabase-queries.ts`
  - Função `getAvailableTimeSlots` (linha ~320)
  - Função `getBarberAvailableTimeSlots` (linha ~660)

## 🧪 Como Testar

1. Acesse as configurações da barbearia
2. Configure um intervalo de almoço (ex: 13:00 - 15:00)
3. Vá para a página de agendamento
4. Selecione um serviço de 45 minutos
5. Escolha a data de hoje
6. Verifique que 15:00 aparece como primeiro horário disponível após o almoço

## ✨ Resultado

Agora o sistema oferece horários a cada 5 minutos, maximizando as opções de agendamento e permitindo que os clientes agendem imediatamente após o intervalo de almoço, sem desperdiçar tempo disponível.
