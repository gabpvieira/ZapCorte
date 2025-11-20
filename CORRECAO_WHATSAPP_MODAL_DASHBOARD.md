# Correção: Envio de WhatsApp no Modal do Dashboard

## Problema Identificado

Ao abrir o modal de agendamento pelo calendário do Dashboard e alterar o status:
1. As mensagens de WhatsApp não estavam sendo enviadas
2. O status era salvo imediatamente ao mudar no Select (sem clicar em "Salvar")
3. As observações também eram salvas imediatamente ao sair do campo

## Causa Raiz

O `Select` de status estava chamando `updateAppointmentStatus` diretamente no `onValueChange`, que:
- Salvava no banco de dados imediatamente
- Tentava enviar WhatsApp na hora
- Não esperava o usuário clicar em "Salvar alterações"

O mesmo acontecia com o `Textarea` de observações usando `onBlur`.

## Solução Implementada

### 1. Nova Função Unificada

Criada função `saveAllChanges` que:
- Salva status, observações E data/hora de uma só vez
- Compara o status original com o novo para detectar mudanças
- Envia WhatsApp APENAS se o status mudou para "cancelled"
- Só é executada quando o usuário clica em "Salvar"

```typescript
const saveAllChanges = async () => {
  if (!selectedAppointment || !editDate || !editTime) return;
  
  setRescheduleLoading(true);
  try {
    // Buscar dados originais para comparar
    const { data: originalData } = await supabase
      .from("appointments")
      .select(`*, service:services(name), barbershop:barbershops(slug, name)`)
      .eq("id", selectedAppointment.id)
      .single();

    // Preparar dados
    const scheduledAt = new Date(`${editDate}T${editTime}:00-03:00`);
    const statusChanged = originalData.status !== selectedAppointment.status;
    const wasCancelled = selectedAppointment.status === 'cancelled' && statusChanged;

    // Atualizar tudo de uma vez
    await supabase
      .from("appointments")
      .update({ 
        status: selectedAppointment.status,
        notes: selectedAppointment.notes || null,
        scheduled_at: scheduledAt.toISOString()
      })
      .eq("id", selectedAppointment.id);

    // Enviar WhatsApp APENAS se foi cancelado
    if (wasCancelled) {
      await enviarCancelamentoWhatsApp({...});
    }
  } finally {
    setRescheduleLoading(false);
  }
};
```

### 2. Select Atualiza Apenas Estado Local

```typescript
<Select 
  value={selectedAppointment.status} 
  onValueChange={(value) => {
    // Atualizar apenas localmente - NÃO salva no banco
    setSelectedAppointment({
      ...selectedAppointment,
      status: value as "pending" | "confirmed" | "cancelled"
    });
  }}
  disabled={rescheduleLoading}
>
```

### 3. Textarea Atualiza Apenas Estado Local

```typescript
<Textarea 
  value={selectedAppointment.notes || ''}
  onChange={(e) => {
    // Atualizar apenas localmente - NÃO salva no banco
    setSelectedAppointment({
      ...selectedAppointment,
      notes: e.target.value
    });
  }}
  disabled={rescheduleLoading}
/>
```

### 4. Botão Salvar Chama Nova Função

```typescript
<Button 
  onClick={saveAllChanges}  // Nova função unificada
  disabled={rescheduleLoading}
>
  Salvar
</Button>
```

### 5. Funções Antigas Removidas

- ❌ `updateAppointmentStatus` - Removida
- ❌ `updateAppointmentNotes` - Removida  
- ❌ `rescheduleAppointment` - Removida
- ✅ `saveAllChanges` - Nova função unificada

## Comportamento Correto Agora

### Fluxo de Edição

1. **Usuário abre o modal** → Dados carregados do banco
2. **Usuário altera status** → Atualizado apenas no estado local
3. **Usuário altera observações** → Atualizado apenas no estado local
4. **Usuário altera data/hora** → Atualizado apenas no estado local
5. **Usuário clica em "Salvar"** → Tudo é salvo de uma vez no banco

### Envio de WhatsApp

- ✅ WhatsApp é enviado APENAS quando:
  - Usuário clica em "Salvar alterações"
  - E o status foi mudado para "cancelled"
  - E o status original era diferente de "cancelled"

- ❌ WhatsApp NÃO é enviado quando:
  - Apenas muda o Select (sem salvar)
  - Status muda de "cancelled" para outro
  - Status permanece "cancelled"
  - Apenas observações ou data/hora são alteradas

## Mensagens de Feedback

### Cancelamento com WhatsApp
```
✅ Alterações salvas
Agendamento cancelado e cliente notificado via WhatsApp.
```

### Cancelamento sem WhatsApp (erro)
```
✅ Alterações salvas
Status atualizado, mas não foi possível enviar WhatsApp.
```

### Outras alterações
```
✅ Alterações salvas
Todas as alterações foram salvas com sucesso.
```

## Arquivos Modificados

- `src/pages/Dashboard.tsx`
  - Removidas 3 funções antigas
  - Adicionada função `saveAllChanges`
  - Atualizado `Select` para usar `onValueChange` local
  - Atualizado `Textarea` para usar `onChange` local
  - Atualizado botão "Salvar" para chamar `saveAllChanges`

## Teste

Para testar a correção:

1. Abra o Dashboard
2. Clique em um agendamento no calendário
3. Altere o status para "Cancelado"
4. **NÃO** deve salvar ainda
5. Adicione uma observação
6. **NÃO** deve salvar ainda
7. Clique em "Salvar alterações"
8. ✅ Deve salvar tudo de uma vez
9. ✅ Deve enviar WhatsApp de cancelamento
10. ✅ Deve mostrar toast de sucesso

---

**Data da Correção**: 20/11/2025
**Status**: ✅ Implementado e Testado
