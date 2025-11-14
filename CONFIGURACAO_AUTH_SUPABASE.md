# Configuração de Autenticação do Supabase

## 📋 Visão Geral

Sistema completo de autenticação com confirmação de email e redefinição de senha integrado ao Supabase.

## 🔧 Configuração no Supabase

### 1. Acessar Configurações de Email

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Authentication** → **Email Templates**

### 2. Configurar URLs de Redirecionamento

#### Template: Confirm Signup (Confirmação de Email)

**Subject:** `Confirme seu email - ZapCorte`

**Body (HTML):**
```html
<h2>Confirme seu email</h2>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}">Confirmar Email</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token={{ .Token }}</p>
```

#### Template: Reset Password (Redefinição de Senha)

**Subject:** `Redefinir senha - ZapCorte`

**Body (HTML):**
```html
<h2>Redefinir sua senha</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
```

### 3. Configurar Site URL

Em **Authentication** → **URL Configuration**:

- **Site URL:** `https://seu-dominio.com` (ou `http://localhost:5173` para desenvolvimento)
- **Redirect URLs:** Adicione as seguintes URLs:
  - `https://seu-dominio.com/auth/confirm`
  - `https://seu-dominio.com/auth/reset-password`
  - `http://localhost:5173/auth/confirm` (desenvolvimento)
  - `http://localhost:5173/auth/reset-password` (desenvolvimento)

## 🎯 Rotas Implementadas

### `/auth/confirm`
Rota principal que processa confirmações de email e redirecionamentos para redefinição de senha.

**Parâmetros:**
- `token` ou `token_hash`: Token de confirmação
- `type`: Tipo de confirmação
  - Se `type=recovery`: Redireciona para `/auth/reset-password`
  - Caso contrário: Confirma email e redireciona para `/login?confirmed=true`

**Fluxo:**
1. Recebe token da URL
2. Verifica o tipo de operação
3. Se for recovery, redireciona para redefinir senha
4. Se for confirmação, valida o email e redireciona para login

### `/auth/reset-password`
Página para o usuário definir uma nova senha.

**Parâmetros:**
- `token`: Token de recuperação

**Funcionalidades:**
- Validação de token
- Formulário de nova senha com confirmação
- Indicador visual de força da senha
- Validação de senhas coincidentes
- Feedback de sucesso/erro

### `/forgot-password`
Página para solicitar redefinição de senha.

**Funcionalidades:**
- Formulário para inserir email
- Envia email de recuperação via Supabase
- Tela de confirmação após envio
- Instruções claras para o usuário

### `/login`
Página de login com feedback de confirmações.

**Parâmetros de URL:**
- `confirmed=true`: Mostra toast de email confirmado
- `reset=success`: Mostra toast de senha redefinida

## 🔐 Fluxos de Autenticação

### Fluxo de Confirmação de Email

```
1. Usuário se registra
   ↓
2. Supabase envia email com link
   ↓
3. Usuário clica no link → /auth/confirm?token=xxx
   ↓
4. Sistema valida token
   ↓
5. Redireciona para /login?confirmed=true
   ↓
6. Mostra mensagem de sucesso
```

### Fluxo de Redefinição de Senha

```
1. Usuário clica em "Esqueceu a senha?"
   ↓
2. Acessa /forgot-password
   ↓
3. Digita email e envia
   ↓
4. Supabase envia email com link
   ↓
5. Usuário clica no link → /auth/confirm?token=xxx&type=recovery
   ↓
6. Sistema redireciona para /auth/reset-password?token=xxx
   ↓
7. Usuário define nova senha
   ↓
8. Sistema atualiza senha via supabase.auth.updateUser()
   ↓
9. Faz logout e redireciona para /login?reset=success
   ↓
10. Mostra mensagem de sucesso
```

## 🎨 Componentes Utilizados

### ResetPassword.tsx
- Formulário de redefinição de senha
- Validação de token
- Indicadores visuais de força da senha
- Feedback com toast

### ForgotPassword.tsx
- Formulário de solicitação de redefinição
- Tela de confirmação de envio
- Instruções para o usuário

### AuthConfirm.tsx (Atualizado)
- Processa confirmação de email
- Detecta tipo de operação (email ou recovery)
- Redireciona para rota apropriada
- Múltiplos métodos de validação de token
- Logs de debug em desenvolvimento

### Login.tsx (Atualizado)
- Link "Esqueceu a senha?"
- Feedback de confirmação de email
- Feedback de redefinição de senha

## 🧪 Testando o Sistema

### Teste de Confirmação de Email

1. Registre um novo usuário
2. Verifique o email recebido
3. Clique no link de confirmação
4. Verifique se foi redirecionado para login com mensagem de sucesso

### Teste de Redefinição de Senha

1. Na página de login, clique em "Esqueceu a senha?"
2. Digite seu email
3. Verifique o email recebido
4. Clique no link de redefinição
5. Digite a nova senha (mínimo 6 caracteres)
6. Confirme a senha
7. Clique em "Redefinir Senha"
8. Verifique se foi redirecionado para login
9. Faça login com a nova senha

## 🔍 Tratamento de Erros

### Erros Comuns

1. **Token inválido ou expirado**
   - Mensagem: "Token inválido ou expirado"
   - Ação: Oferece reenvio de email

2. **Senhas não coincidem**
   - Mensagem: "As senhas digitadas não são iguais"
   - Ação: Usuário corrige as senhas

3. **Senha muito curta**
   - Mensagem: "A senha deve ter pelo menos 6 caracteres"
   - Ação: Usuário digita senha mais longa

4. **Email não encontrado**
   - Mensagem: Erro do Supabase
   - Ação: Usuário verifica email digitado

## 📱 Feedback Visual

### Toast Notifications
- ✅ Email confirmado com sucesso
- ✅ Senha redefinida com sucesso
- ✅ Email de recuperação enviado
- ❌ Erros de validação
- ❌ Token inválido/expirado

### Indicadores de Progresso
- Loading spinner durante validação de token
- Loading spinner durante envio de formulários
- Indicador de força da senha
- Validação visual de senhas coincidentes

## 🔒 Segurança

- Tokens são validados pelo Supabase
- Senhas são hasheadas automaticamente
- Logout automático após redefinição de senha
- Validação de comprimento mínimo de senha
- Links de recuperação expiram automaticamente

## 📝 Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 🚀 Deploy

Após fazer deploy, atualize a **Site URL** no Supabase para o domínio de produção:

1. Acesse **Authentication** → **URL Configuration**
2. Atualize **Site URL** para `https://seu-dominio.com`
3. Adicione as URLs de redirect de produção
4. Teste todos os fluxos em produção

## ✅ Checklist de Implementação

- [x] Rota `/auth/confirm` criada e configurada
- [x] Rota `/auth/reset-password` criada
- [x] Rota `/forgot-password` criada
- [x] Link "Esqueceu a senha?" adicionado ao login
- [x] Feedback visual com toasts implementado
- [x] Validação de senhas implementada
- [x] Tratamento de erros implementado
- [x] Templates de email configurados no Supabase
- [x] URLs de redirect configuradas no Supabase
- [x] Testes realizados

## 🎉 Conclusão

O sistema de autenticação está completo e pronto para uso. Todos os fluxos de confirmação de email e redefinição de senha estão funcionando com feedback visual adequado para o usuário.
