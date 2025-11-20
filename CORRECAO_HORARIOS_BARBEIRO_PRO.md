# 🔧 Correção: Lógica de Horários para Plano PRO

## 📋 Problema Identificado

No Plano PRO, a disponibilidade de horários deve ser calculada **exclusivamente** com base nos horários individuais de cada barbeiro, **ignorando completamente** os horários gerais da barbearia.

### Comportamento Atual (Incorreto)
- Sistema considera horários gerais da barbearia
- Horários dos barbeiros são usados como "filtro adicional"
- Pode mostrar horários indisponíveis se a barbearia estiver fechada

### Comportamento Esperado (Correto)
- **Plano PRO**: Usar APENAS horários individuais dos barbeiros
- **Plano Starter/Freemium**: Usar horários gerais da barbearia
- Horários personalizados por barbeiro têm prioridade absoluta

---

## 🎯 Regras de Negócio

### Plano Starter / Freemium
```
Disponibilidade = Horários da Barbearia - Agendamentos Existentes
```

### Plano PRO
```
Disponibilidade = Horários do Barbeiro - Agendamentos do Barbeiro
```

**Exemplo Prático:**

```
Barbearia: 09:00 - 18:00 (Segunda a Sábado)

Barbeiro João (PRO):
- Segunda: 10:00 - 16:00
- Terça: 14:00 - 20:00
- Quarta: FOLGA
- Quinta: 09:00 - 13:00
- Sexta: 10:00 - 18:00
- Sábado: FOLGA

Barbeiro Pedro (PRO):
- Segunda: 09:00 - 18:00
- Terça: 09:00 - 18:00
- Quarta: 13:00 - 21:00
- Quinta: FOLGA
- Sexta: 09:00 - 18:00
- Sábado: 08:00 - 14:00
```

**Resultado Esperado:**
- Na quarta-feira, João não aparece (folga), mas Pedro está disponível 13:00-21:00
- No sábado, João não aparece (folga), mas Pedro está disponível 08:00-14:00
- Cada barbeiro tem sua própria grade de horários

---

## 🔍 Arquivos Afetados

### 1. `src/lib/supabase-queries.ts`
**Função:** `getAvailableTimeSlots()`

**Problema:**
```typescript
// ❌ ERRADO: Usa horários da barbearia mesmo no PRO
const { data: availability } = await supabase
  .from('availability')
  .select('*')
  .eq('barbershop_id', barbershopId);
```

**Solução:**
```typescript
// ✅ CORRETO: No PRO, usar horários do barbeiro
if (planType === 'pro' && barberId) {
  const { data: barberAvailability } = await supabase
    .from('barber_availability')
    .select('*')
    .eq('barber_id', barberId)
    .eq('is_active', true);
  
  // Usar barberAvailability ao invés de availability
}
```

### 2. Página Pública de Agendamento
**Arquivo:** `src/pages/Booking.tsx` ou similar

**Problema:**
- Cliente escolhe barbeiro
- Sistema ainda valida contra horários da barbearia
- Mostra "Barbearia fechada" mesmo com barbeiro disponível

**Solução:**
- Após escolher barbeiro, buscar `barber_availability`
- Ignorar `availability` da barbearia
- Calcular slots apenas com horários do barbeiro

### 3. Painel de Agendamento Manual
**Arquivo:** `src/pages/Dashboard.tsx` ou `src/components/NewAppointmentModal.tsx`

**Problema:**
- Ao criar agendamento manual no painel
- Sistema valida contra horários gerais
- Bloqueia agendamento fora do horário da barbearia

**Solução:**
- Se barbeiro selecionado, usar `barber_availability`
- Permitir agendamento dentro do horário do barbeiro
- Validar apenas conflitos com outros agendamentos do barbeiro

---

## 🛠️ Implementação

### Passo 1: Atualizar `getAvailableTimeSlots()`

```typescript
export async function getAvailableTimeSlots(
  barbershopId: string,
  serviceId: string,
  date: Date,
  barberId?: string // Novo parâmetro
): Promise<string[]> {
  try {
    // 1. Buscar plano da barbearia
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('plan_type')
      .eq('id', barbershopId)
      .single();
    
    const planType = barbershop?.plan_type || 'freemium';
    const isPro = planType === 'pro';
    
    // 2. Buscar disponibilidade
    let availability;
    
    if (isPro && barberId) {
      // ✅ PLANO PRO: Usar horários do barbeiro
      const { data: barberAvailability } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('is_active', true);
      
      availability = barberAvailability;
    } else {
      // ✅ PLANO STARTER/FREEMIUM: Usar horários da barbearia
      const { data: barbershopAvailability } = await supabase
        .from('availability')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true);
      
      availability = barbershopAvailability;
    }
    
    // 3. Buscar agendamentos existentes
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_at, services(duration)')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay);
    
    // Se PRO e tem barbeiro, filtrar apenas agendamentos desse barbeiro
    const relevantAppointments = (isPro && barberId)
      ? appointments?.filter(apt => apt.barber_id === barberId)
      : appointments;
    
    // 4. Gerar slots disponíveis
    const slots = generateTimeSlots(
      availability,
      relevantAppointments,
      serviceDuration
    );
    
    return slots;
    
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return [];
  }
}
```

### Passo 2: Atualizar Página Pública

```typescript
// src/pages/Booking.tsx

const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
const [availableSlots, setAvailableSlots] = useState<string[]>([]);

// Quando barbeiro é selecionado
const handleBarberSelect = async (barberId: string) => {
  setSelectedBarber(barberId);
  
  // Buscar horários do barbeiro
  const slots = await getAvailableTimeSlots(
    barbershopId,
    serviceId,
    selectedDate,
    barberId // ✅ Passar barberId
  );
  
  setAvailableSlots(slots);
};
```

### Passo 3: Atualizar Painel de Agendamento Manual

```typescript
// src/components/NewAppointmentModal.tsx

const fetchAvailableSlots = async () => {
  if (!selectedService || !selectedDate) return;
  
  const slots = await getAvailableTimeSlots(
    barbershopId,
    selectedService,
    selectedDate,
    selectedBarber // ✅ Passar barbeiro selecionado
  );
  
  setAvailableSlots(slots);
};

// Recarregar slots quando barbeiro mudar
useEffect(() => {
  fetchAvailableSlots();
}, [selectedBarber, selectedService, selectedDate]);
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Atualizar `getAvailableTimeSlots()` para aceitar `barberId`
- [ ] Adicionar lógica condicional baseada no plano
- [ ] Buscar `barber_availability` quando PRO + barberId
- [ ] Filtrar agendamentos por barbeiro no PRO
- [ ] Testar com diferentes cenários

### Frontend - Página Pública
- [ ] Passar `barberId` ao buscar horários
- [ ] Atualizar slots quando barbeiro mudar
- [ ] Remover validação de horários da barbearia no PRO
- [ ] Testar fluxo completo de agendamento

### Frontend - Painel
- [ ] Passar `barberId` ao buscar horários no modal
- [ ] Atualizar slots quando barbeiro mudar
- [ ] Permitir agendamento fora do horário da barbearia (se barbeiro disponível)
- [ ] Testar criação manual de agendamentos

### Validações
- [ ] Barbeiro sem horários configurados = sem slots
- [ ] Barbeiro em folga = sem slots
- [ ] Conflitos apenas com agendamentos do mesmo barbeiro
- [ ] Intervalo de almoço do barbeiro respeitado

---

## 🧪 Cenários de Teste

### Teste 1: Barbeiro com Horário Diferente da Barbearia
```
Barbearia: 09:00 - 18:00
Barbeiro João: 14:00 - 22:00

Resultado Esperado:
- Slots disponíveis: 14:00, 14:30, 15:00... até 22:00
- Não mostrar slots 09:00 - 14:00
```

### Teste 2: Barbeiro em Folga
```
Barbearia: 09:00 - 18:00 (Quarta-feira)
Barbeiro João: FOLGA (Quarta-feira)

Resultado Esperado:
- Nenhum slot disponível para João
- Outros barbeiros ainda aparecem
```

### Teste 3: Múltiplos Barbeiros com Horários Diferentes
```
Barbearia: 09:00 - 18:00

Barbeiro João: 10:00 - 16:00
Barbeiro Pedro: 14:00 - 20:00

Resultado Esperado:
- João: slots 10:00 - 16:00
- Pedro: slots 14:00 - 20:00
- Cada um independente do outro
```

### Teste 4: Agendamento Manual Fora do Horário da Barbearia
```
Barbearia: 09:00 - 18:00
Barbeiro João: 08:00 - 20:00

Ação: Admin tenta agendar às 19:00 para João

Resultado Esperado:
- ✅ Permitir agendamento (João está disponível)
- Não bloquear por "barbearia fechada"
```

---

## 📊 Impacto

### Positivo
- ✅ Flexibilidade total para barbeiros PRO
- ✅ Horários personalizados funcionam corretamente
- ✅ Melhor experiência para barbearias com equipe
- ✅ Diferencial competitivo do Plano PRO

### Atenção
- ⚠️ Planos Starter/Freemium não são afetados
- ⚠️ Migração de dados não necessária
- ⚠️ Compatibilidade retroativa mantida

---

## 🚀 Próximos Passos

1. **Implementar correção** em `supabase-queries.ts`
2. **Atualizar página pública** de agendamento
3. **Atualizar painel** de agendamento manual
4. **Testar todos os cenários**
5. **Deploy em produção**
6. **Monitorar comportamento**

---

**Status:** 📝 Documentado - Aguardando Implementação  
**Prioridade:** 🔴 Alta  
**Impacto:** Plano PRO  
**Data:** 2025-11-20
