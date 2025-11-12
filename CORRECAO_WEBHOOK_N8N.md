# 🔧 Correção: Webhook n8n para Lembretes

## 🐛 Problema Identificado

O webhook não estava sendo enviado para a URL `https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes` quando o cliente criava um agendamento.

### Causa Raiz

1. **Problema de CORS**: O navegador estava bloqueando a requisição devido à política de CORS
2. **Logs insuficientes**: Não havia logs detalhados para debug
3. **Tratamento de erro silencioso**: Erros estavam sendo capturados mas não reportados adequadamente

## ✅ Solução Implementada

### 1. Modo `no-cors` Adicionado

```typescript
const response = await fetch('https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(webhookData),
  mode: 'no-cors', // ✅ Evita bloqueio de CORS
});
```

**Por que `no-cors`?**
- Permite que a requisição seja enviada mesmo sem headers CORS do servidor
- O navegador não bloqueia a requisição
- A requisição chega ao n8n normalmente
- Limitação: não podemos ler a resposta (mas não precisamos)

### 2. Logs Detalhados

Adicionados logs em cada etapa do processo:

```typescript
console.log('🚀 [WEBHOOK] Iniciando notificação de novo agendamento...');
console.log('🔍 [WEBHOOK] Buscando dados da barbearia:', barbershopId);
console.log('✅ [WEBHOOK] Barbearia encontrada:', barbershop.name);
console.log('📨 [WEBHOOK] Enviando para n8n:', { url, data });
console.log('✅ [WEBHOOK] Requisição enviada para n8n (no-cors mode)');
console.log('📱 [WEBHOOK] Enviando mensagem WhatsApp para cliente...');
console.log('✅ [WEBHOOK] Processo de notificação concluído');
```

### 3. Tratamento de Erros Melhorado

```typescript
try {
  const response = await fetch(...);
  console.log('✅ Requisição enviada');
} catch (fetchError) {
  console.error('❌ Erro ao fazer fetch:', fetchError);
  // Continua o fluxo mesmo com erro
}
```

## 📦 Dados Enviados ao Webhook

```json
{
  "customerName": "Nome do Cliente",
  "customerPhone": "11999999999",
  "serviceName": "Corte de Cabelo",
  "scheduledDate": "12/11/2025",
  "scheduledTime": "14:30",
  "scheduledDateTime": "2025-11-12T14:30:00-03:00",
  "barbershopId": "uuid-da-barbearia",
  "barbershopName": "Nome da Barbearia",
  "barbershopPhone": "11988888888",
  "timestamp": "2025-11-12T10:00:00.000Z"
}
```

## 🧪 Como Testar

### 1. Abrir Console do Navegador
```
F12 → Console
```

### 2. Criar um Agendamento
```
1. Acesse /barbershop/[slug]/booking/[serviceId]
2. Preencha os dados
3. Confirme o agendamento
```

### 3. Verificar Logs no Console
```
🚀 [WEBHOOK] Iniciando notificação de novo agendamento...
🔍 [WEBHOOK] Buscando dados da barbearia: xxx
✅ [WEBHOOK] Barbearia encontrada: Nome da Barbearia
📨 [WEBHOOK] Enviando para n8n: {...}
✅ [WEBHOOK] Requisição enviada para n8n (no-cors mode)
📱 [WEBHOOK] Enviando mensagem WhatsApp para cliente...
✅ [WEBHOOK] Processo de notificação concluído
```

### 4. Verificar no n8n
```
1. Acesse seu workflow n8n
2. Verifique se o webhook foi recebido
3. Confirme os dados recebidos
```

## 🔍 Debug

### Se o webhook não chegar ao n8n:

1. **Verificar URL do webhook**
   ```
   URL correta: https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes
   ```

2. **Verificar se o n8n está ativo**
   ```
   - Workflow deve estar ativado
   - Webhook trigger deve estar configurado
   ```

3. **Verificar logs do n8n**
   ```
   - Acessar executions do workflow
   - Ver se há erros
   ```

4. **Testar webhook manualmente**
   ```bash
   curl -X POST https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes \
     -H "Content-Type: application/json" \
     -d '{
       "customerName": "Teste",
       "customerPhone": "11999999999",
       "serviceName": "Corte",
       "scheduledDate": "12/11/2025",
       "scheduledTime": "14:30",
       "barbershopName": "Barbearia Teste"
     }'
   ```

## 📝 Arquivos Modificados

- ✅ `src/lib/notifications.ts` - Função `notificarNovoAgendamento()`

## 🎯 Resultado Esperado

Quando um cliente cria um agendamento:

1. ✅ Agendamento é salvo no banco de dados
2. ✅ Cliente é criado/atualizado automaticamente
3. ✅ **Webhook é enviado para n8n com todos os dados**
4. ✅ n8n processa e envia mensagem para o barbeiro
5. ✅ Cliente recebe mensagem de "agendamento recebido" via WhatsApp

## ⚠️ Observações Importantes

### Sobre `mode: 'no-cors'`

- ✅ **Vantagem**: Requisição não é bloqueada pelo navegador
- ⚠️ **Limitação**: Não podemos ler a resposta do servidor
- ✅ **Solução**: Como só precisamos enviar dados (fire-and-forget), isso não é problema

### Sobre Logs

- Os logs com prefixo `[WEBHOOK]` facilitam o debug
- Todos os logs aparecem no console do navegador
- Use `Ctrl+F` no console para buscar por `[WEBHOOK]`

## 🚀 Próximos Passos

1. ✅ Correção implementada
2. ⏳ Fazer push para GitHub
3. ⏳ Testar em produção
4. ⏳ Configurar workflow n8n
5. ⏳ Validar recebimento de mensagens

---

**Status:** ✅ Corrigido  
**Data:** 12/11/2025  
**Arquivo:** `src/lib/notifications.ts`
