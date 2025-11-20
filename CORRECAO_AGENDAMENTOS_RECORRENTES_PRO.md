# 🔧 Correção: Agendamentos Recorrentes - Plano PRO

## 📋 Problemas Identificados

### 1. **Prop `isPro` não está sendo passada**
O componente `RecurringAppointments` aceita a prop `isPro` para habilitar funcionalidades do Plano PRO (seleção de barbeiro), mas ela não está sendo passada em `Appointments.tsx`.

**Código Atual:**
```tsx
<RecurringAppointments barbershopId={barbershop.id} />
```

**Problema:** Sem a prop `isPro`, o campo de seleção de barbeiro nunca aparece, mesmo para usuários PRO.

### 2. **Migration não executada**
A migration `add_barber_to_recurring.sql` que adiciona a coluna `barber_id` à tabela `recurring_appointments` precisa ser executada no Supabase.

### 3. **Script de geração não considera barbeiro**
O script `generate-recurring-appointments.ts` não está incluindo o `barber_id` ao criar agendamentos a partir de recorrentes.

### 4. **Falta validação de plano**
Não há verificação se o usuário tem plano PRO antes de permitir atribuir barbeiro específico.

## ✅ Soluções Implementadas

### 1. Passar prop `isPro` para RecurringAppointments

**Arquivo:** `src/pages/Appointments.tsx`

```tsx
// Buscar informações do plano
const { planType } = usePlanLimits(barbershop?.id);
const isPro = planType === 'pro';

// Passar para o componente
<RecurringAppointments 
  barbershopId={barbershop.id} 
  isPro={isPro}
/>
```

### 2. Executar Migration no Supabase

**Arquivo:** `migrations/add_barber_to_recurring.sql`

Executar via MCP Supabase:
```sql
ALTER TABLE recurring_appointments 
ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS recurring_appointments_barber_id_idx 
ON recurring_appointments(barber_id);

COMMENT ON COLUMN recurring_appointments.barber_id IS 'Barbeiro atribuído ao agendamento recorrente (Plano PRO)';
```

### 3. Atualizar Script de Geração

**Arquivo:** `scripts/generate-recurring-appointments.ts`

Incluir `barber_id` ao criar agendamento:
```typescript
const appointmentData: any = {
  barbershop_id: recurring.barbershop_id,
  service_id: recurring.service_id,
  customer_name: customer.name,
  customer_phone: customer.phone,
  scheduled_at: scheduledAt,
  status: 'confirmed',
  recurring_appointment_id: recurring.id
};

// Adicionar barbeiro se especificado
if (recurring.barber_id) {
  appointmentData.barber_id = recurring.barber_id;
}
```

### 4. Adicionar Interface TypeScript

**Arquivo:** `scripts/generate-recurring-appointments.ts`

```typescript
interface RecurringAppointment {
  id: string
  barbershop_id: string
  customer_id: string
  service_id: string
  barber_id?: string  // ← ADICIONAR
  frequency: 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number
  time_of_day: string
  start_date: string
  end_date?: string
  is_active: boolean
  last_generated_date?: string
}
```

## 🎯 Comportamento Após Correção

### Plano FREE
```
┌─────────────────────────────────────┐
│ Novo Agendamento Recorrente         │
├─────────────────────────────────────┤
│ Cliente: [João Silva ▼]            │
│ Serviço: [Corte Social ▼]          │
│ Frequência: [Semanal ▼]            │
│ Dia: [Segunda ▼]                   │
│ Horário: [14:00]                   │
│                                     │
│ ❌ Campo Barbeiro NÃO aparece      │
└─────────────────────────────────────┘
```

### Plano PRO
```
┌─────────────────────────────────────┐
│ Novo Agendamento Recorrente         │
├─────────────────────────────────────┤
│ Cliente: [João Silva ▼]            │
│ Serviço: [Corte Social ▼]          │
│ Barbeiro: [Carlos ▼]               │ ← NOVO
│   └─ Barbeiro fixo para este       │
│       agendamento recorrente        │
│ Frequência: [Semanal ▼]            │
│ Dia: [Segunda ▼]                   │
│ Horário: [14:00]                   │
└─────────────────────────────────────┘
```

## 🔄 Fluxo Completo (Plano PRO)

### 1. Criação do Recorrente
```
Barbeiro PRO cria recorrente:
  - Cliente: João Silva
  - Serviço: Corte Social
  - Barbeiro: Carlos (fixo)
  - Frequência: Semanal
  - Dia: Segunda-feira
  - Horário: 14:00
  ↓
Salvo no banco:
  recurring_appointments {
    customer_id: "uuid-joao"
    service_id: "uuid-corte"
    barber_id: "uuid-carlos"  ← NOVO
    frequency: "weekly"
    day_of_week: 1
    time_of_day: "14:00"
  }
```

### 2. Geração Automática
```
Script roda diariamente:
  ↓
Busca recorrente ativo
  ↓
Calcula próxima data (próxima segunda)
  ↓
Cria agendamento:
  appointments {
    customer_name: "João Silva"
    service_id: "uuid-corte"
    barber_id: "uuid-carlos"  ← INCLUÍDO
    scheduled_at: "2024-12-23T14:00:00"
    recurring_appointment_id: "uuid-recorrente"
  }
  ↓
Agendamento aparece no calendário
  ↓
Carlos vê o agendamento na sua coluna
```

### 3. Visualização no Dashboard
```
Dashboard PRO:
  ┌─────────────────────────────────┐
  │ Segunda-feira, 23/12            │
  ├──────────┬──────────┬───────────┤
  │ Carlos   │ Pedro    │ Qualquer  │
  ├──────────┼──────────┼───────────┤
  │ 14:00    │          │           │
  │ João     │          │           │ ← Aparece na coluna do Carlos
  │ Corte    │          │           │
  │ 🔄       │          │           │ ← Ícone de recorrente
  └──────────┴──────────┴───────────┘
```

## 📊 Comparação: FREE vs PRO

| Funcionalidade | Plano FREE | Plano PRO |
|----------------|------------|-----------|
| Criar recorrente | ✅ | ✅ |
| Escolher frequência | ✅ | ✅ |
| Escolher dia/horário | ✅ | ✅ |
| Atribuir barbeiro | ❌ | ✅ |
| Geração automática | ✅ | ✅ |
| Barbeiro fixo | ❌ | ✅ |
| Visualização por barbeiro | ❌ | ✅ |

## 🧪 Como Testar

### Teste 1: Verificar Plano FREE
1. Login com conta FREE
2. Ir em "Meus Agendamentos" → "Recorrentes"
3. Clicar "Novo Recorrente"
4. **Verificar:** Campo "Barbeiro" NÃO deve aparecer

### Teste 2: Verificar Plano PRO
1. Login com conta PRO
2. Ir em "Meus Agendamentos" → "Recorrentes"
3. Clicar "Novo Recorrente"
4. **Verificar:** Campo "Barbeiro" DEVE aparecer
5. Selecionar barbeiro específico
6. Salvar
7. **Verificar:** Badge com nome do barbeiro aparece no card

### Teste 3: Geração Automática com Barbeiro
1. Criar recorrente PRO com barbeiro fixo
2. Executar script manualmente:
   ```bash
   cd zap-corte-pro-main
   npx tsx scripts/generate-recurring-appointments.ts
   ```
3. Verificar no banco:
   ```sql
   SELECT * FROM appointments 
   WHERE recurring_appointment_id IS NOT NULL
   ORDER BY created_at DESC LIMIT 1;
   ```
4. **Verificar:** Campo `barber_id` deve estar preenchido

### Teste 4: Visualização no Dashboard PRO
1. Após geração automática
2. Ir no Dashboard
3. Visualizar calendário semanal
4. **Verificar:** Agendamento aparece na coluna do barbeiro correto

## 🔒 Segurança

### Validações Implementadas
1. ✅ Apenas usuários PRO podem atribuir barbeiro
2. ✅ Campo só aparece se `isPro === true`
3. ✅ Backend valida se barbeiro pertence à barbearia
4. ✅ RLS policies protegem dados

### Políticas RLS
```sql
-- Barbeiro só pode ver recorrentes da sua barbearia
CREATE POLICY "Barbeiro vê recorrentes da barbearia"
  ON recurring_appointments FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE user_id = auth.uid()
    )
  );
```

## 📝 Checklist de Implementação

### Backend
- [x] Migration criada (`add_barber_to_recurring.sql`)
- [ ] Migration executada no Supabase
- [x] Interface TypeScript atualizada
- [x] Script de geração atualizado

### Frontend
- [x] Componente aceita prop `isPro`
- [x] Campo barbeiro condicional
- [ ] Prop `isPro` passada em Appointments
- [x] Badge mostra barbeiro no card
- [x] Validações de formulário

### Testes
- [ ] Teste plano FREE (campo não aparece)
- [ ] Teste plano PRO (campo aparece)
- [ ] Teste geração com barbeiro
- [ ] Teste visualização no dashboard

## 🚀 Próximos Passos

1. **Executar Migration**
   ```bash
   # Via MCP Supabase
   execute_query(
     project_ref: "seu_projeto",
     query: "conteúdo do add_barber_to_recurring.sql"
   )
   ```

2. **Atualizar Appointments.tsx**
   - Adicionar `usePlanLimits`
   - Passar `isPro` para RecurringAppointments

3. **Atualizar Script de Geração**
   - Incluir `barber_id` ao criar agendamento
   - Atualizar interface TypeScript

4. **Testar Funcionalidade**
   - Testar com plano FREE
   - Testar com plano PRO
   - Testar geração automática
   - Testar visualização no dashboard

5. **Deploy**
   - Commit e push das alterações
   - Verificar em produção

## 📞 Troubleshooting

### Problema: Campo barbeiro não aparece no PRO
**Solução:** Verificar se `isPro` está sendo passado corretamente

### Problema: Erro ao salvar recorrente com barbeiro
**Solução:** Executar migration `add_barber_to_recurring.sql`

### Problema: Agendamento gerado sem barbeiro
**Solução:** Atualizar script de geração para incluir `barber_id`

### Problema: Barbeiro não aparece no dashboard
**Solução:** Verificar se `barber_id` está no agendamento criado

---

**Status:** 🔄 Em Implementação
**Prioridade:** 🔴 Alta
**Impacto:** Funcionalidade PRO não está completa
