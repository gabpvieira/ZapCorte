# ✅ Correção: Sincronização de Horários de Funcionamento

## 🎯 Problema Corrigido

**Antes:**
- ❌ Terça-feira marcada como FECHADO no painel, mas aparecia como ABERTO na página pública
- ❌ Quarta-feira marcada como ABERTO no painel, mas não permitia agendamentos
- ❌ Dias invertidos ou com comportamento inconsistente

**Causa Raiz:**
- Timezone incorreto ao calcular `dayOfWeek`
- `new Date(date).getDay()` usa UTC, causando diferença de 1 dia em alguns casos
- Brasil está em UTC-3, então datas sem timezone podem ser interpretadas incorretamente

## 🔧 Correções Aplicadas

### 1. **Timezone Correto no Cálculo do Dia**

**Antes (Errado):**
```typescript
const dayOfWeek = new Date(date).getDay();
// date = "2025-11-11"
// new Date("2025-11-11") = 2025-11-11T00:00:00Z (UTC)
// No Brasil (UTC-3), isso é 2025-11-10T21:00:00 (dia anterior!)
```

**Depois (Correto):**
```typescript
const dateWithTimezone = new Date(date + 'T12:00:00-03:00');
const dayOfWeek = dateWithTimezone.getDay();
// date = "2025-11-11"
// new Date("2025-11-11T12:00:00-03:00") = meio-dia no Brasil
// dayOfWeek = 2 (Terça-feira) ✅
```

### 2. **Verificação de Dia Fechado**

Adicionada verificação explícita se o dia está fechado:

```typescript
// Verificar se o dia está fechado no opening_hours
const dayKey = dayOfWeek.toString();
const daySchedule = barbershop.opening_hours?.[dayKey];

// Se o dia está marcado como null (fechado) ou não existe, retornar vazio
if (!daySchedule || daySchedule === null) {
  console.log('[getAvailableTimeSlots] Dia fechado, retornando vazio');
  return [];
}
```

### 3. **Logs Detalhados**

Adicionados logs para facilitar debug:

```typescript
console.log('[getAvailableTimeSlots] Buscando horários:', {
  barbershopId,
  serviceId,
  date,
  dateWithTimezone: dateWithTimezone.toISOString(),
  dayOfWeek,
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
});

console.log('[getAvailableTimeSlots] Horário do dia:', {
  dayKey,
  daySchedule,
  allOpeningHours: barbershop.opening_hours
});
```

### 4. **Uso de opening_hours ao invés de availability**

**Antes:**
- Usava tabela `availability` (que pode não existir ou estar desatualizada)

**Depois:**
- Usa `opening_hours` diretamente da tabela `barbershops`
- Fonte única de verdade
- Sincronização garantida

## 📊 Estrutura de Dados

### opening_hours (JSON):
```json
{
  "0": null,                              // Domingo: Fechado
  "1": { "start": "09:00", "end": "19:00" },  // Segunda: 09:00-19:00
  "2": null,                              // Terça: Fechado
  "3": { "start": "09:00", "end": "19:00" },  // Quarta: 09:00-19:00
  "4": { "start": "09:00", "end": "19:00" },  // Quinta: 09:00-19:00
  "5": { "start": "09:00", "end": "19:00" },  // Sexta: 09:00-19:00
  "6": null                               // Sábado: Fechado
}
```

### Mapeamento de Dias:
| Número | Dia da Semana | Exemplo |
|--------|---------------|---------|
| 0 | Domingo | 10/11/2025 |
| 1 | Segunda-feira | 11/11/2025 |
| 2 | Terça-feira | 12/11/2025 |
| 3 | Quarta-feira | 13/11/2025 |
| 4 | Quinta-feira | 14/11/2025 |
| 5 | Sexta-feira | 15/11/2025 |
| 6 | Sábado | 16/11/2025 |

## 🧪 Como Testar

### Teste 1: Verificar Dia Fechado (Terça)
1. Ir para página pública: `/barbershop/gabriel-barbeiro`
2. Clicar em qualquer serviço
3. Selecionar terça-feira (12/11/2025)
4. **Resultado esperado:** Nenhum horário disponível

### Teste 2: Verificar Dia Aberto (Quarta)
1. Ir para página pública: `/barbershop/gabriel-barbeiro`
2. Clicar em qualquer serviço
3. Selecionar quarta-feira (13/11/2025)
4. **Resultado esperado:** Horários disponíveis (09:00, 09:25, 09:50, etc.)

### Teste 3: Verificar Logs
1. Abrir DevTools (F12)
2. Ir para aba Console
3. Selecionar uma data
4. **Logs esperados:**
```
[getAvailableTimeSlots] Buscando horários: {
  date: "2025-11-12",
  dayOfWeek: 2,
  dayName: "Terça"
}
[getAvailableTimeSlots] Horário do dia: {
  dayKey: "2",
  daySchedule: null
}
[getAvailableTimeSlots] Dia fechado, retornando vazio
```

## ✅ Resultado Final

### Comportamento Correto:

| Dia | Configuração | Página Pública | Status |
|-----|--------------|----------------|--------|
| Domingo | Fechado | Sem horários | ✅ |
| Segunda | 09:00-19:00 | Horários disponíveis | ✅ |
| Terça | Fechado | Sem horários | ✅ |
| Quarta | 09:00-19:00 | Horários disponíveis | ✅ |
| Quinta | 09:00-19:00 | Horários disponíveis | ✅ |
| Sexta | 09:00-19:00 | Horários disponíveis | ✅ |
| Sábado | Fechado | Sem horários | ✅ |

### Badge de Status:
- **FECHADO** (vermelho) quando o dia atual está fechado
- **ABERTO** (verde) quando o dia atual está aberto

### Texto de Horários:
```
Dom: Fechado • Seg: 09:00-19:00 • Ter: Fechado • Qua: 09:00-19:00 • 
Qui: 09:00-19:00 • Sex: 09:00-19:00 • Sáb: Fechado
```

## 🔍 Funções Afetadas

1. **getAvailableTimeSlots** (supabase-queries.ts)
   - Agora usa timezone correto
   - Verifica opening_hours diretamente
   - Retorna array vazio para dias fechados

2. **isBarbershopOpen** (barbershop-utils.ts)
   - Já estava correto
   - Usa timezone brasileiro

3. **formatOpeningHours** (barbershop-utils.ts)
   - Já estava correto
   - Mostra "Fechado" para dias null

## 🚀 Impacto

- ✅ Página pública sincronizada com configurações
- ✅ Clientes não podem agendar em dias fechados
- ✅ Badge de status correto
- ✅ Horários exibidos corretamente
- ✅ Reagendamento também respeita dias fechados

## 📝 Notas Técnicas

### Por que o timezone importa?

```javascript
// Sem timezone (UTC):
new Date("2025-11-11").getDay()
// = 2025-11-11T00:00:00Z (meia-noite UTC)
// No Brasil (UTC-3) = 2025-11-10T21:00:00 (ainda é dia 10!)
// getDay() = 1 (Segunda) ❌ ERRADO!

// Com timezone brasileiro:
new Date("2025-11-11T12:00:00-03:00").getDay()
// = 2025-11-11T12:00:00-03:00 (meio-dia no Brasil)
// getDay() = 2 (Terça) ✅ CORRETO!
```

### Por que usar opening_hours?

- **Fonte única:** Dados salvos diretamente pelo barbeiro
- **Sincronização:** Não depende de tabela separada
- **Simplicidade:** Menos queries, mais rápido
- **Confiabilidade:** Sempre atualizado

---

**Data:** 11/11/2025  
**Status:** ✅ Corrigido  
**Testado:** Terça (fechado) e Quarta (aberto)  
**Impacto:** Alto - Corrige bug crítico de agendamento
