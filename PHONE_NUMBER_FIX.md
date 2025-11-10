# Correção - Obtenção do Número do WhatsApp

## Problema Identificado
O número do WhatsApp não estava sendo salvo corretamente no banco de dados quando a conexão era estabelecida, causando erro ao tentar enviar mensagem de teste.

## Soluções Implementadas

### 1. ✅ Função Dedicada para Buscar Info da Instância
Criada nova função `getInstanceInfo()` que busca especificamente informações da instância:

```typescript
async getInstanceInfo(sessionId: string): Promise<{ phone?: string; state?: string }> {
  const endpoints = [
    `/instance/fetchInstances?instanceName=${sessionId}`,
    `/instance/connectionState/${sessionId}`,
  ];
  // Busca e extrai o número de diferentes formatos de resposta
}
```

### 2. ✅ Melhorada Função getSessionStatus
Agora suporta múltiplos formatos de resposta da API Evolution:

**Formatos Suportados:**
- `{ instance: { state, owner } }` - Formato padrão
- `{ state, phone }` - Formato alternativo
- `[{ state, owner }]` - Array de instâncias
- Números com formato `5511999999999@s.whatsapp.net` - Extrai apenas o número

**Endpoints Testados:**
1. `/instance/connectionState/{sessionId}`
2. `/instance/fetchInstances?instanceName={sessionId}`
3. `/status/{sessionId}`
4. `/{sessionId}/status`

### 3. ✅ Fluxo de Teste Melhorado
Agora o teste de mensagem:

1. **Verifica banco**: Busca `whatsapp_phone` no Supabase
2. **Se não tiver**: Chama `getInstanceInfo()` para buscar da API
3. **Fallback**: Se falhar, tenta `getSessionStatus()`
4. **Atualiza banco**: Salva o número para próximas vezes
5. **Envia teste**: Usa o número obtido

### 4. ✅ Logs Detalhados
Adicionados logs em cada etapa para facilitar debug:

```javascript
console.log('Número não encontrado no banco, buscando da API...');
console.log('Verificando status no endpoint:', endpoint);
console.log('Resposta do status:', result);
console.log('Estado extraído:', state, 'Telefone:', phone);
console.log('Número obtido da API:', phoneNumber);
console.log('Número atualizado no banco:', phoneNumber);
```

## Fluxo Completo

### Quando Conecta o WhatsApp
```
1. Usuário escaneia QR Code
2. Evolution API confirma conexão
3. Hook checkConnectionStatus() é chamado
4. getSessionStatus() busca informações
5. Número é extraído da resposta
6. Salvo no banco: whatsapp_phone
7. Estado atualizado: isConnected = true
```

### Quando Testa Mensagem
```
1. Usuário clica "Enviar Teste para Mim"
2. Verifica se whatsapp_phone existe no banco
3. Se NÃO existir:
   a. Chama getInstanceInfo()
   b. Se falhar, chama getSessionStatus()
   c. Extrai número da resposta
   d. Salva no banco
4. Usa o número para enviar teste
5. Mostra feedback de sucesso/erro
```

## Formatos de Número Suportados

A API pode retornar o número em diferentes formatos:

| Formato | Exemplo | Tratamento |
|---------|---------|------------|
| Completo | `5511999999999@s.whatsapp.net` | Remove `@s.whatsapp.net` |
| Limpo | `5511999999999` | Usa direto |
| Com código | `+55 11 99999-9999` | Remove formatação |

## Endpoints da Evolution API

### Buscar Instâncias
```
GET /instance/fetchInstances?instanceName={sessionId}
Retorna: [{ owner, state, connectionStatus }]
```

### Status da Conexão
```
GET /instance/connectionState/{sessionId}
Retorna: { instance: { state, owner } }
```

### Status Alternativo
```
GET /status/{sessionId}
Retorna: { state, phone, number }
```

## Tratamento de Erros

| Erro | Causa | Solução |
|------|-------|---------|
| "WhatsApp não está conectado" | Session ID inválido | Reconectar WhatsApp |
| "Número do WhatsApp não encontrado" | API não retornou número | Verificar logs, reconectar |
| "Não foi possível obter o número" | Todos endpoints falharam | Verificar API Evolution |

## Como Testar

1. **Conectar WhatsApp**
   - Escanear QR Code
   - Aguardar conexão
   - Verificar se número foi salvo no banco

2. **Verificar no Supabase**
   ```sql
   SELECT whatsapp_phone FROM barbershops WHERE id = 'seu-id';
   ```

3. **Testar Mensagem**
   - Clicar em "Enviar Teste para Mim"
   - Verificar logs no console
   - Confirmar recebimento no WhatsApp

## Logs para Debug

Abra o Console do navegador (F12) e procure por:
- ✅ "Número obtido da API: 5511999999999"
- ✅ "Número atualizado no banco: 5511999999999"
- ✅ "QR Code carregado com sucesso"
- ❌ "Erro ao verificar status"
- ❌ "Endpoint falhou"

## Resultado Esperado

Após as correções:
1. ✅ Número salvo automaticamente ao conectar
2. ✅ Teste de mensagem funciona sem erros
3. ✅ Próximos testes são mais rápidos (número já salvo)
4. ✅ Logs claros para debug
5. ✅ Suporte a múltiplos formatos da API