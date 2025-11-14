# 🔧 Correção: Redefinição de Senha com Supabase

## 🐛 Problema Identificado

O link de redefinição de senha está usando o formato antigo do Supabase:
```
https://zapcorte.com.br/auth/confirm?token=143886&type=recovery
```

Este formato usa um OTP (código numérico) que precisa ser validado de forma diferente.

## ✅ Solução Implementada

### 1. Atualização do AuthConfirm.tsx

O fluxo agora:
1. Recebe o token de recovery
2. Valida usando `verifyOtp` com `type: 'recovery'`
3. Cria uma sessão temporária
4. Redireciona para `/auth/reset-password` (sem token na URL)

### 2. Atualização do ResetPassword.tsx

A página agora:
1. Verifica se há uma sessão ativa (criada pelo token de recovery)
2. Permite redefinir a senha usando `updateUser()`
3. Faz logout após redefinir
4. Redireciona para login

## 🔧 Configuração Correta no Supabase

### Opção 1: Usar PKCE Flow (Recomendado)

No painel do Supabase, vá em **Authentication** → **Email Templates** → **Reset Password**:

**Template atualizado:**
```html
<h2>Redefinir sua senha</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
```

**Importante:** Use `{{ .TokenHash }}` em vez de `{{ .Token }}`

### Opção 2: Manter OTP (Atual)

Se preferir manter o formato atual com OTP numérico, o código já está preparado para lidar com isso.

**Template atual (funciona):**
```html
<h2>Redefinir sua senha</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
```

## 🧪 Como Testar

### 1. Solicitar Redefinição

```bash
# Acesse
https://zapcorte.com.br/forgot-password

# Digite seu email e envie
```

### 2. Verificar Email

Você receberá um email com um link como:
```
https://zapcorte.com.br/auth/confirm?token=123456&type=recovery
```
ou
```
https://zapcorte.com.br/auth/confirm?token_hash=abc123...&type=recovery
```

### 3. Clicar no Link

O sistema irá:
1. Validar o token
2. Criar uma sessão temporária
3. Redirecionar para `/auth/reset-password`

### 4. Redefinir Senha

1. Digite a nova senha (mínimo 6 caracteres)
2. Confirme a senha
3. Clique em "Redefinir Senha"
4. Será redirecionado para login

## 🔍 Debug

### Verificar Logs no Console

Abra o console do navegador (F12) e procure por:
```
[AuthConfirm] Parâmetros: token_hash=..., token=..., type=recovery
[AuthConfirm] Tipo: recovery - processando token de recuperação
[AuthConfirm] Tentando verifyOtp com tipo recovery
[AuthConfirm] ✅ Token de recovery validado com sucesso
```

### Verificar Sessão

No console, execute:
```javascript
const { data } = await supabase.auth.getSession();
console.log(data.session);
```

Deve retornar uma sessão válida após clicar no link de recovery.

## 🚨 Erros Comuns

### Erro: "Token inválido ou expirado"

**Causa:** Token OTP já foi usado ou expirou (1 hora)

**Solução:** Solicite um novo link de redefinição

### Erro: "Sessão inválida"

**Causa:** Não há sessão ativa ao acessar `/auth/reset-password`

**Solução:** Clique novamente no link do email

### Erro 404 no Supabase

**Causa:** Token não foi validado corretamente

**Solução:** Verifique se o template do email está correto

## 📝 Checklist de Configuração

- [ ] Template de email configurado no Supabase
- [ ] Site URL configurada: `https://zapcorte.com.br`
- [ ] Redirect URLs adicionadas:
  - [ ] `https://zapcorte.com.br/auth/confirm`
  - [ ] `https://zapcorte.com.br/auth/reset-password`
  - [ ] `https://zapcorte.com.br/forgot-password`
- [ ] Código atualizado e deployado
- [ ] Teste realizado em produção

## 🔐 Fluxo Completo

```
1. Usuário acessa /forgot-password
   ↓
2. Digite email e clica em "Enviar"
   ↓
3. Supabase envia email com link
   ↓
4. Usuário clica no link
   → /auth/confirm?token=XXX&type=recovery
   ↓
5. Sistema valida token com verifyOtp
   ↓
6. Cria sessão temporária
   ↓
7. Redireciona para /auth/reset-password
   ↓
8. Usuário define nova senha
   ↓
9. Sistema chama updateUser({ password })
   ↓
10. Faz logout
   ↓
11. Redireciona para /login?reset=success
   ↓
12. Mostra toast de sucesso
```

## ✅ Alterações Realizadas

### AuthConfirm.tsx
- Adicionado suporte para `type=recovery`
- Implementado `verifyOtp` com tipo `recovery`
- Criação de sessão antes de redirecionar
- Melhor tratamento de erros

### ResetPassword.tsx
- Removida dependência de token na URL
- Verificação de sessão ativa
- Redirecionamento para `/forgot-password` se sessão inválida
- Logout após redefinir senha

### Fluxo de Segurança
- Token é validado apenas uma vez
- Sessão temporária é criada
- Logout automático após redefinir
- Novo login necessário com nova senha

## 🎯 Próximos Passos

1. Fazer deploy das alterações
2. Testar fluxo completo em produção
3. Verificar se emails estão chegando
4. Confirmar que redefinição funciona
5. Documentar para usuários finais
