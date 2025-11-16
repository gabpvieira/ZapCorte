# Implementação do Intervalo de Almoço

## 📋 Resumo
Implementação de funcionalidade para configurar um horário fixo de intervalo de almoço que bloqueia automaticamente os agendamentos durante este período.

## 🎯 Objetivo
Permitir que o barbeiro configure um horário de pausa para almoço (ex: 13:00 às 14:00) que será bloqueado automaticamente em todos os dias de funcionamento, impedindo que clientes agendem serviços neste período.

## 🔧 Alterações Realizadas

### 1. Banco de Dados (Supabase)
**Arquivo:** Query SQL executada via MCP Supabase

```sql
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS lunch_break JSONB DEFAULT '{"start": "13:00", "end": "14:00", "enabled": false}'::jsonb;

COMMENT ON COLUMN barbershops.lunch_break IS 'Horário de intervalo de almoço do barbeiro. Formato: {"start": "HH:MM", "end": "HH:MM", "enabled": boolean}';
```

**Estrutura do campo `lunch_break`:**
```json
{
  "start": "13:00",
  "end": "14:00",
  "enabled": false
}
```

### 2. Tipos TypeScript
**Arquivo:** `src/lib/supabase.ts`

Adicionado o campo `lunch_break` na interface `Barbershop`:

```typescript
export interface Barbershop {
  // ... outros campos
  lunch_break?: {
    start: string
    end: string
    enabled: boolean
  }
  // ... outros campos
}
```

### 3. Lógica de Bloqueio de Horários
**Arquivo:** `src/lib/supabase-queries.ts`

Modificada a função `getAvailableTimeSlots` para:
- Buscar o campo `lunch_break` da barbearia
- Verificar se o intervalo está habilitado
- Bloquear horários que colidem com o intervalo de almoço

**Lógica implementada:**
```typescript
// Verificar se o horário colide com o intervalo de almoço
if (available && barbershop.lunch_break?.enabled) {
  const lunchStart = new Date(`${date}T${barbershop.lunch_break.start}-03:00`);
  const lunchEnd = new Date(`${date}T${barbershop.lunch_break.end}-03:00`);
  
  // Se o serviço começa antes do fim do almoço E termina depois do início do almoço
  if (slotStart < lunchEnd && slotEnd > lunchStart) {
    available = false;
  }
}
```

### 4. Interface de Configuração
**Arquivo:** `src/pages/BarbershopSettings.tsx`

Adicionado novo card de configuração com:

#### Estado do componente:
```typescript
const [lunchBreak, setLunchBreak] = useState<{
  start: string;
  end: string;
  enabled: boolean;
}>({
  start: "13:00",
  end: "14:00",
  enabled: false
});
```

#### Elementos da interface:
1. **Switch para ativar/desativar** o intervalo
2. **Campos de horário** (início e fim) - aparecem apenas quando ativado
3. **Validação** - garante que o horário de início seja menor que o de fim
4. **Informações visuais** sobre como funciona a feature

#### Validação no salvamento:
```typescript
if (lunchBreak.enabled && lunchBreak.start >= lunchBreak.end) {
  toast({
    title: "Horário de almoço inválido",
    description: "O horário de início deve ser menor que o de fim.",
    variant: "destructive",
  });
  return;
}
```

## 🎨 Design da Interface

### Card de Intervalo de Almoço
- **Cor temática:** Amber (laranja/amarelo) para diferenciar dos horários de funcionamento
- **Toggle switch:** Ativa/desativa o intervalo
- **Campos de horário:** Inputs do tipo `time` com step de 15 minutos (900 segundos)
- **Card informativo:** Explica como a funcionalidade funciona

### Elementos visuais:
- Ícone de relógio (Clock) em amber
- Background amber suave quando ativado
- Card informativo azul com dicas de uso

## 🔄 Fluxo de Funcionamento

1. **Configuração:**
   - Barbeiro acessa "Personalizar Barbearia"
   - Ativa o switch "Ativar Intervalo de Almoço"
   - Define horário de início (ex: 13:00)
   - Define horário de fim (ex: 14:00)
   - Salva as alterações

2. **Bloqueio automático:**
   - Sistema verifica se `lunch_break.enabled === true`
   - Para cada horário disponível, verifica colisão com o intervalo
   - Marca como indisponível qualquer horário que:
     - Comece antes do fim do almoço E
     - Termine depois do início do almoço

3. **Experiência do cliente:**
   - Cliente acessa página de agendamento
   - Horários durante o intervalo aparecem como indisponíveis
   - Cliente não consegue selecionar estes horários

## ✅ Validações Implementadas

1. **Horário válido:** Início deve ser menor que fim
2. **Formato correto:** HH:MM (24 horas)
3. **Persistência:** Dados salvos no banco junto com outras configurações
4. **Carregamento:** Valores carregados automaticamente ao abrir a página

## 🧪 Testes Sugeridos

1. **Teste básico:**
   - Ativar intervalo das 13:00 às 14:00
   - Verificar que horários neste período ficam indisponíveis

2. **Teste de colisão:**
   - Serviço de 60 minutos
   - Tentar agendar às 12:30 (deve bloquear, pois termina às 13:30)
   - Tentar agendar às 14:00 (deve permitir)

3. **Teste de desativação:**
   - Desativar o intervalo
   - Verificar que todos os horários voltam a ficar disponíveis

4. **Teste de validação:**
   - Tentar salvar com horário de início maior que fim
   - Verificar mensagem de erro

## 📝 Observações Importantes

- O intervalo é aplicado em **todos os dias de funcionamento**
- Não afeta dias que estão marcados como "Fechado"
- Funciona em conjunto com os horários de funcionamento normais
- Respeita o timezone brasileiro (America/Sao_Paulo)
- Não permite agendamentos que colidam parcialmente com o intervalo

## 🚀 Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:
1. Permitir múltiplos intervalos por dia
2. Configurar intervalos diferentes por dia da semana
3. Adicionar intervalo de café da manhã/tarde
4. Visualização gráfica dos horários bloqueados no calendário

## 📊 Impacto

- ✅ Melhora a gestão de tempo do barbeiro
- ✅ Evita agendamentos durante o horário de almoço
- ✅ Interface simples e intuitiva
- ✅ Não quebra funcionalidades existentes
- ✅ Totalmente opcional (pode ser desativado)
