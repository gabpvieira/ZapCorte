# 🔑 Como Obter a REST API Key Correta do OneSignal

## Problema Atual

A chave fornecida é uma **Organization API Key** (`os_v2_org_...`), mas precisamos da **REST API Key** do app específico.

## Passo a Passo

### 1. Acessar o Dashboard do OneSignal

1. Acesse: https://app.onesignal.com
2. Faça login na sua conta
3. Selecione o app **ZapCorte** (App ID: `4b3e5d19-c380-453a-b727-ed1cd29e1d8a`)

### 2. Obter a REST API Key

1. No menu lateral, clique em **Settings**
2. Clique em **Keys & IDs**
3. Procure por **REST API Key**
4. A chave deve começar com algo como:
   - `YourRestApiKeyHere` (formato antigo)
   - `os_v2_app_...` (formato novo)
   - **NÃO** deve ser `os_v2_org_...` (essa é da organização)

### 3. Copiar a Chave Correta

```
REST API Key: [copie aqui]
```

### 4. Atualizar no Projeto

#### Localmente (.env.local)
```bash
VITE_ONESIGNAL_REST_API_KEY=sua-rest-api-key-aqui
```

#### No Vercel
1. Settings → Environment Variables
2. Edite `VITE_ONESIGNAL_REST_API_KEY`
3. Cole a nova chave
4. Salve e faça redeploy

## Diferença entre as Chaves

### ❌ Organization API Key (ERRADA para notificações)
```
os_v2_org_hg63ke2npjgmxlbmiq6jrbqd3asofgetzgeehkefvj67mivdcxeqe7w2zx7x26pste4d7vhlgp7ib6g4wkgd6jm56mricgwexlq6vwq
```
- Usada para gerenciar a organização
- Não funciona para enviar notificações

### ✅ REST API Key (CORRETA)
```
YourRestApiKeyHere
ou
os_v2_app_...
```
- Usada para enviar notificações
- Específica do app

## Teste Após Atualizar

1. Atualize a chave no `.env.local`
2. Reinicie o servidor: `npm run dev`
3. Execute o teste: `node test-onesignal.js`
4. Deve retornar sucesso (mesmo com 0 recipients se não tiver Player ID válido)

## Alternativa: Usar User Auth Key

Se não encontrar a REST API Key, você pode usar a **User Auth Key**:

1. Settings → Keys & IDs
2. Procure por **User Auth Key**
3. Use essa chave no lugar da REST API Key

## Suporte

Se ainda tiver problemas:
1. Verifique se você tem permissões de admin no app
2. Tente criar uma nova REST API Key
3. Entre em contato com o suporte do OneSignal

## Próximos Passos

Após obter a chave correta:
1. ✅ Atualizar `.env.local`
2. ✅ Atualizar no Vercel
3. ✅ Testar com `node test-onesignal.js`
4. ✅ Testar no app: `/dashboard/notifications`
