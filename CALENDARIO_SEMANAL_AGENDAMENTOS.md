# 📅 Calendário Semanal de Agendamentos

## 🎯 Objetivo

Adicionar visualização em calendário semanal na página "Meus Agendamentos", permitindo ao barbeiro ver horários ocupados e livres de forma clara e rápida, facilitando a criação de novos agendamentos manuais.

## ✨ Funcionalidades Implementadas

### 1. **Toggle de Visualização** ✅
- Botão de troca entre **Lista** e **Calendário**
- Ícones intuitivos (List e CalendarDays)
- Transição suave entre visualizações
- Estado mantido durante a sessão

### 2. **Visualização em Calendário** ✅
- **Visualização semanal** com 7 dias
- **Horários**: 8h às 22h (15 horas)
- **Navegação**: Semana anterior/próxima e botão "Hoje"
- **Destaque**: Dia atual com cor diferenciada
- **Scroll**: Vertical para horários

### 3. **Blocos de Agendamento** ✅
- **Cores por status**:
  - 🟢 Verde: Confirmado
  - 🟡 Amarelo: Pendente
  - 🔴 Vermelho: Cancelado
- **Informações exibidas**:
  - Nome do cliente
  - Nome do serviço
  - Horário
- **Posicionamento preciso**: Baseado em minutos e duração
- **Animação**: Fade-in ao aparecer

### 4. **Interatividade** ✅
- **Clique no agendamento**: Abre modal de detalhes
- **Clique em horário vazio**: Abre formulário de novo agendamento com data/hora preenchidas
- **Tooltip ao hover**: Mostra informações completas (desktop)
  - Nome do cliente
  - Telefone
  - Serviço e duração
  - Horário
  - Status

### 5. **Responsividade** ✅
- **Mobile**: Scroll horizontal suave
- **Tablet/Desktop**: Visualização completa
- **Touch-friendly**: Toques sensíveis em mobile
- **Mínimo 800px**: Garante legibilidade

## 🏗️ Arquitetura

### Componentes Criados

#### `WeeklyCalendar.tsx`
```typescript
interface WeeklyCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
}
```

**Responsabilidades**:
- Renderizar grid semanal
- Calcular posicionamento dos agendamentos
- Gerenciar navegação entre semanas
- Emitir eventos de clique

### Modificações em `Appointments.tsx`

**Adicionado**:
- Import do componente `Tabs`
- Import do `WeeklyCalendar`
- Estado `viewMode` para controlar visualização
- Integração com formulário de novo agendamento

## 🎨 Design System

### Cores de Status
```tsx
const statusColors = {
  pending: "bg-yellow-500/20 border-yellow-500 text-yellow-900",
  confirmed: "bg-green-500/20 border-green-500 text-green-900",
  cancelled: "bg-red-500/20 border-red-500 text-red-900",
};
```

### Layout
- **Grid**: 8 colunas (1 para horários + 7 para dias)
- **Altura mínima por hora**: 80px
- **Padding dos blocos**: 1.5 (6px)
- **Border left**: 4px para destaque de status

## 🔧 Funcionalidades Técnicas

### Cálculo de Posicionamento
```typescript
const calculateAppointmentPosition = (appointment: Appointment) => {
  const aptDate = parseISO(appointment.scheduled_at);
  const minutes = aptDate.getMinutes();
  const duration = appointment.service?.duration || 30;
  
  return {
    top: `${(minutes / 60) * 100}%`,
    height: `${(duration / 60) * 100}%`,
  };
};
```

### Filtro de Agendamentos por Horário
```typescript
const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
  return appointments.filter(apt => {
    const aptDate = parseISO(apt.scheduled_at);
    const aptHour = aptDate.getHours();
    return isSameDay(aptDate, day) && aptHour === hour;
  });
};
```

### Navegação de Semanas
```typescript
const goToPreviousWeek = () => {
  setCurrentWeekStart(prev => subWeeks(prev, 1));
};

const goToNextWeek = () => {
  setCurrentWeekStart(prev => addWeeks(prev, 1));
};

const goToToday = () => {
  setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
};
```

## 📱 Responsividade

### Mobile (< 640px)
- Scroll horizontal habilitado
- Largura mínima: 800px
- Botões compactos
- Tooltip desabilitado (apenas clique)

### Tablet (640px - 1024px)
- Visualização completa
- Tooltip habilitado
- Botões normais

### Desktop (> 1024px)
- Visualização otimizada
- Tooltip com informações completas
- Hover effects

## 🧪 Testes

### Cenários de Teste

#### 1. Visualização
- [ ] Calendário exibe semana atual corretamente
- [ ] Navegação entre semanas funciona
- [ ] Botão "Hoje" retorna para semana atual
- [ ] Dia atual está destacado

#### 2. Agendamentos
- [ ] Blocos aparecem nos horários corretos
- [ ] Cores correspondem aos status
- [ ] Duração dos blocos está correta
- [ ] Múltiplos agendamentos no mesmo horário são exibidos

#### 3. Interatividade
- [ ] Clique em agendamento abre modal de detalhes
- [ ] Clique em horário vazio abre formulário
- [ ] Data e hora são preenchidas automaticamente
- [ ] Tooltip mostra informações corretas (desktop)

#### 4. Responsividade
- [ ] Scroll horizontal funciona em mobile
- [ ] Layout não quebra em telas pequenas
- [ ] Toques funcionam corretamente
- [ ] Transição entre visualizações é suave

## 🚀 Como Usar

### Para o Barbeiro

1. **Acessar Agendamentos**
   - Menu lateral → "Meus Agendamentos"

2. **Alternar para Calendário**
   - Clicar no botão "Calendário" no toggle

3. **Navegar entre Semanas**
   - Usar setas ← → para mudar de semana
   - Clicar em "Hoje" para voltar à semana atual

4. **Ver Detalhes de Agendamento**
   - Clicar no bloco do agendamento
   - Modal com detalhes completos abre

5. **Criar Novo Agendamento**
   - Clicar em um horário vazio
   - Formulário abre com data/hora preenchidas
   - Preencher dados do cliente e serviço
   - Confirmar

6. **Identificar Status**
   - 🟢 Verde = Confirmado
   - 🟡 Amarelo = Pendente
   - 🔴 Vermelho = Cancelado

## 💡 Melhorias Futuras

### Fase 2 (Opcional)
- [ ] Drag & drop para reagendar
- [ ] Visualização mensal
- [ ] Filtros no calendário
- [ ] Exportar calendário (iCal)
- [ ] Sincronização com Google Calendar
- [ ] Visualização de múltiplos barbeiros
- [ ] Bloqueio de horários
- [ ] Horários de almoço/pausa

### Fase 3 (Avançado)
- [ ] Avatar do cliente nos blocos
- [ ] Imagem do serviço
- [ ] Cores personalizadas por serviço
- [ ] Notificações de conflitos
- [ ] Sugestão de horários livres
- [ ] Estatísticas de ocupação

## 📊 Métricas de Sucesso

### KPIs
- **Tempo para criar agendamento**: Redução de 30%
- **Visualização de disponibilidade**: Instantânea
- **Erros de agendamento**: Redução de 50%
- **Satisfação do barbeiro**: Aumento esperado

### Feedback Esperado
- ✅ Mais fácil ver horários livres
- ✅ Criação de agendamentos mais rápida
- ✅ Melhor planejamento do dia
- ✅ Menos conflitos de horário

## 🐛 Troubleshooting

### Problema: Agendamentos não aparecem
**Solução**: Verificar se os agendamentos têm `scheduled_at` válido

### Problema: Posicionamento incorreto
**Solução**: Verificar se `service.duration` está definido

### Problema: Scroll não funciona em mobile
**Solução**: Verificar se `overflow-auto` está aplicado

### Problema: Tooltip não aparece
**Solução**: Verificar se `TooltipProvider` está envolvendo o componente

## 📚 Dependências

### Bibliotecas Utilizadas
- `date-fns`: Manipulação de datas
- `framer-motion`: Animações
- `lucide-react`: Ícones
- `@radix-ui/react-tabs`: Componente de tabs
- `@radix-ui/react-tooltip`: Tooltips

### Componentes Internos
- `Button`, `Card`, `Input`, `Label`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`

## 🎓 Referências

- [FullCalendar.io](https://fullcalendar.io/) - Inspiração de design
- [React Big Calendar](https://github.com/jquense/react-big-calendar) - Referência de funcionalidades
- [date-fns Documentation](https://date-fns.org/) - Manipulação de datas

---

**Status**: ✅ Implementado e funcional
**Versão**: 1.0.0
**Data**: 14/11/2024
**Desenvolvido por**: Equipe ZapCorte
