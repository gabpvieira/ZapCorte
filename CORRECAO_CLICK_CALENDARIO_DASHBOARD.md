# Correção: Click em Horário Vazio do Calendário no Dashboard

## Problema Identificado

Ao clicar em um horário vazio no calendário (DayCalendar) na página do Dashboard, o sistema redirecionava para a página inicial (HomeNew) ao invés de abrir o modal de novo agendamento.

## Causa Raiz

1. **Estados Faltantes no Dashboard**: As variáveis `selectedDate`, `selectedTime`, `customers`, `barbers`, `selectedBarberId`, `loadingBarbers` e `submitting` não estavam declaradas, causando erro quando o `onTimeSlotClick` era chamado.

2. **Propagação de Evento**: O evento de click no DayCalendar não estava prevenindo a propagação, o que poderia causar comportamentos inesperados.

3. **Modal sem Suporte a Valores Iniciais**: O `NewAppointmentModal` não tinha props para receber data e hora pré-selecionadas.

## Solução Implementada

### 1. Dashboard.tsx - Estados Adicionados

```typescript
// Estados para novo agendamento com horário pré-selecionado
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [selectedTime, setSelectedTime] = useState<string>("");

// Estados para modal de novo agendamento
const [customers, setCustomers] = useState<any[]>([]);
const [barbers, setBarbers] = useState<any[]>([]);
const [selectedBarberId, setSelectedBarberId] = useState<string>("");
const [loadingBarbers, setLoadingBarbers] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

### 2. Dashboard.tsx - Função de Fechar Modal

```typescript
// Função para fechar modal de novo agendamento
const closeNewAppointmentModal = () => {
  setNewAppointmentOpen(false);
  setSelectedDate(null);
  setSelectedTime("");
  setSelectedBarberId("");
};
```

### 3. DayCalendar.tsx - Prevenção de Propagação

```typescript
<div 
  className="flex-1 relative cursor-pointer hover:bg-muted/30 transition-colors"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onTimeSlotClick?.(`${String(hour).padStart(2, '0')}:00`);
  }}
/>
```

### 4. NewAppointmentModal.tsx - Props Iniciais

**Interface atualizada:**
```typescript
interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: string;
  services: Service[];
  onSuccess: () => void;
  isPro: boolean;
  initialDate?: Date | null;
  initialTime?: string;
}
```

**useEffect para aplicar valores iniciais:**
```typescript
useEffect(() => {
  if (open) {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialTime) {
      setSelectedTime(initialTime);
    }
  }
}, [open, initialDate, initialTime]);
```

### 5. Dashboard.tsx - Props do Modal

```typescript
<NewAppointmentModal
  open={newAppointmentOpen}
  onOpenChange={(open) => {
    setNewAppointmentOpen(open);
    if (!open) {
      closeNewAppointmentModal();
    }
  }}
  barbershopId={barbershop?.id || ""}
  services={services}
  onSuccess={refetchDashboard}
  isPro={planLimits.features.multipleBarbers}
  initialDate={selectedDate}
  initialTime={selectedTime}
/>
```

## Resultado

✅ Ao clicar em um horário vazio no calendário, o modal de novo agendamento abre corretamente
✅ A data e hora clicadas são pré-selecionadas no modal
✅ Não há mais redirecionamento indesejado para a página inicial
✅ O evento de click é tratado corretamente sem propagação

## Arquivos Modificados

1. `src/pages/Dashboard.tsx`
   - Adicionados estados faltantes
   - Adicionada função `closeNewAppointmentModal`
   - Atualizadas props do `NewAppointmentModal`

2. `src/components/DayCalendar.tsx`
   - Adicionado `e.preventDefault()` e `e.stopPropagation()` no onClick

3. `src/components/NewAppointmentModal.tsx`
   - Adicionadas props `initialDate` e `initialTime`
   - Adicionado useEffect para aplicar valores iniciais

## Teste

Para testar a correção:

1. Acesse o Dashboard
2. Visualize o calendário do dia
3. Clique em qualquer horário vazio (área cinza)
4. Verifique se o modal de novo agendamento abre
5. Confirme que a data e hora estão pré-selecionadas
6. Verifique que não há redirecionamento para outra página

---

**Data da Correção**: 20/11/2025
**Status**: ✅ Implementado e Testado
