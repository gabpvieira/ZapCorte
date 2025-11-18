# 📅 Melhoria do Calendário - Sistema de Colunas

## 🎯 Problema Resolvido

Cards de agendamentos se sobrepunham quando havia múltiplos agendamentos no mesmo horário, dificultando a visualização.

## ✨ Solução Implementada

Sistema de detecção de conflitos e organização em colunas, inspirado em **Google Calendar**, **Cal.com** e **Calendly**.

---

## 🔧 Como Funciona

### 1. Detecção de Sobreposição

O algoritmo verifica se dois agendamentos se sobrepõem comparando:
- **Início do Agendamento A** < **Fim do Agendamento B**
- **Fim do Agendamento A** > **Início do Agendamento B**

```typescript
if (current.startTime < other.endTime && current.endTime > other.startTime) {
  // Há sobreposição!
}
```

### 2. Organização em Colunas

Quando há sobreposição:
1. **Encontra a primeira coluna disponível** para cada agendamento
2. **Calcula o número total de colunas** necessárias
3. **Distribui os cards** proporcionalmente

### 3. Cálculo de Largura e Posição

```typescript
// Largura de cada coluna
const columnWidth = 100 / totalColumns;

// Posição horizontal
const leftPosition = columnWidth * columnIndex;

// Largura do card (com espaçamento)
width = `calc(${columnWidth}% - ${totalColumns > 1 ? '4px' : '2px'})`
```

---

## 📊 Exemplos Visuais

### Antes (Sobreposição)
```
13:00 ┌─────────────────┐
      │ João Silva      │
      │ Corte Social    │
14:00 ├─────────────────┤
      │ Pedro Santos    │ ← Sobreposto!
      │ Barba           │
15:00 └─────────────────┘
```

### Depois (Colunas)
```
13:00 ┌────────┬────────┐
      │ João   │ Pedro  │
      │ Corte  │ Barba  │
14:00 ├────────┼────────┤
      │        │        │
15:00 └────────┴────────┘
```

---

## 🎨 Características

### Espaçamento Inteligente

- **1 coluna**: espaçamento de 2px
- **2+ colunas**: espaçamento de 4px entre cards

### Responsividade

- Cards se ajustam automaticamente à largura disponível
- Mantém legibilidade mesmo com 3+ colunas

### Priorização Visual

- Cards mantêm cores de status (confirmado, pendente, cancelado)
- Hover eleva o card (z-index) para melhor visualização
- Animações suaves ao aparecer/desaparecer

---

## 🔄 Algoritmo Detalhado

### Passo 1: Ordenar Agendamentos
```typescript
appointments.sort((a, b) => 
  parseISO(a.scheduled_at).getTime() - parseISO(b.scheduled_at).getTime()
);
```

### Passo 2: Detectar Conflitos
```typescript
for (let i = 0; i < result.length; i++) {
  const current = result[i];
  const overlapping = [];
  
  for (let j = 0; j < result.length; j++) {
    if (i === j) continue;
    
    const other = result[j];
    
    if (current.startTime < other.endTime && 
        current.endTime > other.startTime) {
      overlapping.push(j);
    }
  }
}
```

### Passo 3: Atribuir Colunas
```typescript
if (overlapping.length > 0) {
  // Encontrar primeira coluna disponível
  const usedColumns = new Set(overlapping.map(idx => result[idx].column));
  let column = 0;
  while (usedColumns.has(column)) {
    column++;
  }
  current.column = column;
  
  // Calcular total de colunas
  const maxColumn = Math.max(column, ...overlapping.map(idx => result[idx].column));
  const totalColumns = maxColumn + 1;
  
  // Atualizar todos os agendamentos sobrepostos
  current.totalColumns = totalColumns;
  overlapping.forEach(idx => {
    result[idx].totalColumns = Math.max(result[idx].totalColumns, totalColumns);
  });
}
```

---

## 📱 Casos de Uso

### Caso 1: Sem Conflitos
```
13:00 - João (Corte)
14:00 - Pedro (Barba)
15:00 - Maria (Coloração)
```
**Resultado**: 1 coluna, largura 100%

### Caso 2: 2 Agendamentos Simultâneos
```
13:00 - João (Corte 1h)
13:30 - Pedro (Barba 30min)
```
**Resultado**: 2 colunas, largura 50% cada

### Caso 3: 3+ Agendamentos Simultâneos
```
14:00 - João (Corte 1h)
14:00 - Pedro (Barba 1h)
14:30 - Maria (Coloração 2h)
```
**Resultado**: 3 colunas, largura 33.33% cada

---

## 🎯 Benefícios

### Para o Usuário
- ✅ Visualização clara de todos os agendamentos
- ✅ Sem sobreposição ou cards escondidos
- ✅ Fácil identificação de horários ocupados
- ✅ Melhor planejamento do dia

### Para o Sistema
- ✅ Algoritmo eficiente O(n²)
- ✅ Memoização para performance
- ✅ Animações suaves
- ✅ Responsivo e adaptável

---

## 🚀 Melhorias Futuras

- [ ] Drag & drop para reagendar
- [ ] Redimensionar cards para ajustar duração
- [ ] Visualização semanal com colunas
- [ ] Cores personalizadas por serviço
- [ ] Indicador de capacidade máxima

---

## 📚 Inspiração

### Google Calendar
- Sistema de colunas automático
- Detecção inteligente de conflitos
- Cores por categoria

### Cal.com
- Design minimalista
- Espaçamento generoso
- Hover states elegantes

### Calendly
- Visualização clara de disponibilidade
- Cards compactos e informativos
- Animações suaves

---

**Data de Implementação:** 18 de Novembro de 2025  
**Status:** ✅ Implementado  
**Versão:** 2.0.0

