# 🐛 Debug: Horários de Funcionamento

## ❌ Problema Identificado

**Sintoma:**
- Terça-feira (dia 2) está marcada como FECHADO no painel
- Mas na página pública está mostrando como ABERTO e permitindo agendamentos
- Quarta-feira (dia 3) está marcada como ABERTO no painel
- Mas na página pública não está permitindo agendamentos

## 🔍 Estrutura de Dados

### Como os dias são numerados:
```javascript
0 = Domingo
1 = Segunda-feira
2 = Terça-feira
3 = Quarta-feira
4 = Quinta-feira
5 = Sexta-feira
6 = Sábado
```

### Estrutura do opening_hours:
```json
{
  "0": null,              // Domingo fechado
  "1": { "start": "09:00", "end": "19:00" },  // Segunda aberta
  "2": null,              // Terça fechada
  "3": { "start": "09:00", "end": "19:00" },  // Quarta aberta
  "4": { "start": "09:00", "end": "19:00" },  // Quinta aberta
  "5": { "start": "09:00", "end": "19:00" },  // Sexta aberta
  "6": null               // Sábado fechado
}
```

## 🔧 Verificações Necessárias

### 1. Verificar como está salvo no banco:
```sql
SELECT id, name, opening_hours 
FROM barbershops 
WHERE slug = 'gabriel-barbeiro';
```

### 2. Verificar logs no console:
Abrir DevTools (F12) e procurar por:
```
[getAvailableTimeSlots] Buscando horários:
[getAvailableTimeSlots] Horário do dia:
```

### 3. Verificar função JavaScript:
```javascript
const date = new Date('2025-11-11'); // Terça-feira
const dayOfWeek = date.getDay(); // Deve retornar 2
console.log('Dia da semana:', dayOfWeek);
```

## 🎯 Possíveis Causas

### Causa 1: Timezone
O JavaScript pode estar usando timezone diferente:
```javascript
// Errado:
new Date('2025-11-11').getDay() // Pode retornar dia errado

// Correto:
new Date('2025-11-11T12:00:00-03:00').getDay()
```

### Causa 2: Formato da Data
A data pode estar sendo parseada incorretamente:
```javascript
// Se date = "2025-11-11"
new Date(date).getDay() // Pode dar problema com timezone UTC

// Melhor:
new Date(date + 'T12:00:00-03:00').getDay()
```

### Causa 3: Opening Hours não está sincronizado
O banco pode ter dados antigos ou corrompidos.

## ✅ Solução Aplicada

### 1. Adicionar logs detalhados em getAvailableTimeSlots:
```typescript
console.log('[getAvailableTimeSlots] Buscando horários:', {
  barbershopId,
  serviceId,
  date,
  dayOfWeek
});

console.log('[getAvailableTimeSlots] Horário do dia:', {
  dayKey,
  daySchedule,
  allOpeningHours: barbershop.opening_hours
});
```

### 2. Garantir timezone correto:
```typescript
// Usar timezone brasileiro explicitamente
const date = new Date(dateString + 'T12:00:00-03:00');
const dayOfWeek = date.getDay();
```

### 3. Verificar se daySchedule é null:
```typescript
if (!daySchedule || daySchedule === null) {
  console.log('[getAvailableTimeSlots] Dia fechado, retornando vazio');
  return [];
}
```

## 🧪 Como Testar

### Teste 1: Verificar dia da semana
```javascript
// No console do navegador:
const hoje = new Date();
console.log('Hoje é:', hoje.toLocaleDateString('pt-BR'));
console.log('Dia da semana (número):', hoje.getDay());
console.log('Dia da semana (nome):', hoje.toLocaleDateString('pt-BR', { weekday: 'long' }));
```

### Teste 2: Verificar opening_hours
```javascript
// No console, após carregar a página:
// Ir para Application > Local Storage ou Session Storage
// Ou fazer query no Supabase
```

### Teste 3: Testar agendamento
1. Ir para página pública da barbearia
2. Clicar em um serviço
3. Selecionar terça-feira (deve estar vazio)
4. Selecionar quarta-feira (deve mostrar horários)

## 📊 Logs Esperados (Correto)

### Terça-feira (Fechado):
```
[getAvailableTimeSlots] Buscando horários: {
  barbershopId: "xxx",
  serviceId: "yyy",
  date: "2025-11-11",
  dayOfWeek: 2
}

[getAvailableTimeSlots] Horário do dia: {
  dayKey: "2",
  daySchedule: null,
  allOpeningHours: { "0": null, "1": {...}, "2": null, ... }
}

[getAvailableTimeSlots] Dia fechado, retornando vazio
```

### Quarta-feira (Aberto):
```
[getAvailableTimeSlots] Buscando horários: {
  barbershopId: "xxx",
  serviceId: "yyy",
  date: "2025-11-12",
  dayOfWeek: 3
}

[getAvailableTimeSlots] Horário do dia: {
  dayKey: "3",
  daySchedule: { start: "09:00", end: "19:00" },
  allOpeningHours: { "0": null, "1": {...}, "2": null, "3": {...}, ... }
}

[getAvailableTimeSlots] Horários de trabalho: {
  workStart: "2025-11-12T09:00:00-03:00",
  workEnd: "2025-11-12T19:00:00-03:00",
  serviceDuration: 20,
  breakTime: 5
}
```

## 🔍 Checklist de Debug

- [ ] Verificar logs no console
- [ ] Confirmar dia da semana correto (getDay())
- [ ] Verificar opening_hours no banco
- [ ] Confirmar que terça (2) está null
- [ ] Confirmar que quarta (3) tem horários
- [ ] Testar agendamento em terça (deve falhar)
- [ ] Testar agendamento em quarta (deve funcionar)

## 🚨 Se ainda não funcionar

### Verificar no Supabase:
```sql
-- Ver opening_hours atual
SELECT opening_hours FROM barbershops WHERE slug = 'gabriel-barbeiro';

-- Forçar atualização (se necessário)
UPDATE barbershops 
SET opening_hours = '{
  "0": null,
  "1": {"start": "09:00", "end": "19:00"},
  "2": null,
  "3": {"start": "09:00", "end": "19:00"},
  "4": {"start": "09:00", "end": "19:00"},
  "5": {"start": "09:00", "end": "19:00"},
  "6": null
}'::jsonb
WHERE slug = 'gabriel-barbeiro';
```

### Limpar cache:
1. Ctrl + Shift + Delete
2. Limpar cache e cookies
3. Recarregar página (Ctrl + F5)

---

**Data:** 11/11/2025  
**Status:** 🔍 Investigando  
**Próximo passo:** Verificar logs no console
