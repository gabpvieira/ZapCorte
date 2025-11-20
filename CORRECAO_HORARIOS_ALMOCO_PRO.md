# Correção: Horários Após Intervalo de Almoço (Plano PRO)

## 🐛 Problema Identificado

No Plano PRO, quando um barbeiro tinha intervalo de almoço configurado (ex: 13:00-15:00) e o cliente selecionava um serviço de 45 minutos, o próximo horário disponível após o almoço aparecia como **15:40** ao invés de **15:00**.

### Exemplo do Bug
- Intervalo de almoço: 13:00 - 15:00
- Serviço: 45 minutos
- Último horário antes do almoço: 12:15
- **Esperado**: Próximo horário às 15:00
- **Bug**: Próximo horário às 15:40 (40 minutos perdidos)

## 🔍 Causa Raiz

A função `getBarberAvailableTimeSlots` estava avançando o cursor de horários usando sempre o mesmo passo (`serviceDuration + breakTime`), sem considerar que quando o próximo slot cairia dentro do intervalo de almoço, deveria pular diretamente para o fim do almoço.

### Lógica Antiga (Incorreta)
```typescript
// Sempre avançava pelo mesmo passo
cursor = new Date(cursor.getTime() + stepMs);
cursor = roundToNext5(cursor);
```

Isso fazia com que:
1. Último slot antes do almoço: 12:15
2. Próximo cursor: 12:15 + 45min + 5min = 13:05 (dentro do almoço)
3. Slot marcado como indisponível
4. Próximo cursor: 13:05 + 50min = 13:55 (ainda no almoço)
5. Slot marcado como indisponível
6. Próximo cursor: 13:55 + 50min = 14:45 (ainda no almoço)
7. Slot marcado como indisponível
8. Próximo cursor: 14:45 + 50min = **15:35** (finalmente disponível)
9. Arredondado para 15:40

## ✅ Solução Implementada

Modificada a lógica de avanço do cursor para detectar quando o próximo slot cairia dentro do intervalo de almoço e pular diretamente para o fim do almoço.

### Lógica Nova (Correta)
```typescript
// Avançar cursor
// Se o próximo slot cairia dentro do intervalo de almoço, pular para o fim do almoço
let nextCursor = new Date(cursor.getTime() + stepMs);

if (lunchStart && lunchEnd) {
  const nextSlotEnd = new Date(nextCursor.getTime() + serviceDuration * 60000);
  
  // Se o próximo slot começaria durante o almoço ou terminaria durante o almoço
  if (nextCursor < lunchEnd && nextSlotEnd > lunchStart) {
    // Pular para o fim do almoço
    nextCursor = new Date(lunchEnd);
    console.log('[getBarberAvailableTimeSlots] Pulando intervalo de almoço, próximo slot:', nextCursor.toTimeString().slice(0, 5));
  }
}

cursor = roundToNext5(nextCursor);
```

Agora:
1. Último slot antes do almoço: 12:15
2. Próximo cursor: 12:15 + 50min = 13:05
3. **Detecta que 13:05 está dentro do almoço (13:00-15:00)**
4. **Pula diretamente para 15:00**
5. Próximo slot disponível: **15:00** ✅

## 📝 Arquivos Modificados

### `src/lib/supabase-queries.ts`
- Função `getBarberAvailableTimeSlots`: Corrigida lógica de avanço do cursor
- Otimização: Preparar variáveis de almoço antes do loop
- Melhor detecção de colisão com intervalo de almoço

### `src/components/BarberForm.tsx`
- Correção adicional: Dados do barbeiro não carregavam no modal de edição
- Adicionado `useEffect` para atualizar formulário quando barbeiro muda

## 🧪 Como Testar

1. Acesse uma conta com Plano PRO
2. Configure um barbeiro com horário de almoço (ex: 13:00-15:00)
3. Na página de booking, selecione um serviço de 45 minutos
4. Verifique que após o último horário antes do almoço (12:15), o próximo disponível é **15:00**
5. Não deve haver "buracos" de horários indisponíveis após o almoço

## ✨ Benefícios

- ✅ Horários corretos após intervalo de almoço
- ✅ Melhor aproveitamento da agenda
- ✅ Experiência do cliente melhorada
- ✅ Menos confusão sobre horários disponíveis
- ✅ Código mais eficiente (menos iterações desnecessárias)

## 🎯 Impacto

**Apenas Plano PRO**: Esta correção afeta apenas usuários do Plano PRO que utilizam horários personalizados por barbeiro. O Plano Starter/Freemium continua usando a lógica de horários da barbearia.

---

**Data**: 20/11/2024
**Versão**: 2.4.1
**Tipo**: Correção (PATCH)
