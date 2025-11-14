# 📧 Links Corretos para Emails do Supabase

## 🔗 Formato dos Links

O Supabase pode usar dois formatos diferentes dependendo da configuração:

### Formato 1: PKCE Flow (Recomendado) ✅

```
https://zapcorte.com.br/auth/confirm?token_hash=pkce_abc123...xyz&type=email
```

**Características:**
- Token longo e seguro (PKCE)
- Parâmetro: `token_hash`
- Mais seguro e moderno

### Formato 2: OTP (One-Time Password) ✅

```
https://zapcorte.com.br/auth/confirm?token=123456
```

**Características:**
- Token numérico curto (6 dígitos)
- Parâmetro: `token`
- Formato legado, mas funcional

## 📝 Templates Corretos no Supabase

### 1. Confirmação de Email (Confirm Signup)

Acesse: **Authentication** → **Email Templates** → **Confirm Signup**

#### Opção A: PKCE (Recomendado)
```html
<h2>Confirme seu email - ZapCorte</h2>
<p>Obrigado por se cadastrar! Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirmar Email</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</p>
<p>Se você não criou esta conta, ignore este email.</p>
<p>Este link expira em 24 horas.</p>
```

#### Opção B: OTP (Compatibilidade)
```html
<h2>Confirme seu email - ZapCorte</h2>
<p>Obrigado por se cadastrar! Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}">Confirmar Email</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token={{ .Token }}</p>
<p>Se você não criou esta conta, ignore este email.</p>
<p>Este link expira em 24 horas.</p>
```

### 2. Redefinição de Senha (Reset Password)

Acesse: **Authentication** → **Email Templates** → **Reset Password**

#### Opção A: PKCE (Recomendado)
```html
<h2>Redefinir sua senha - ZapCorte</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
```

#### Opção B: OTP (Compatibilidade)
```html
<h2>Redefinir sua senha - ZapCorte</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
```

## 🔧 Configuração no Supabase

### Passo 1: Acessar Configurações

1. Acesse: https://app.supabase.com
2. Selecione o projeto: **Zap Corte**
3. Vá em: **Authentication** → **URL Configuration**

### Passo 2: Configurar Site URL

```
Site URL: https://zapcorte.com.br
```

**Importante:** Sem barra no final!

### Passo 3: Adicionar Redirect URLs

Adicione estas URLs (uma por linha):

```
https://zapcorte.com.br/auth/confirm
https://zapcorte.com.br/auth/reset-password
https://zapcorte.com.br/auth/callback
https://zapcorte.com.br/login
https://zapcorte.com.br/dashboard
```

### Passo 4: Configurar Templates de Email

1. Vá em: **Authentication** → **Email Templates**
2. Configure cada template conforme acima
3. Clique em **Save** em cada um

## 🧪 Como Testar

### Teste 1: Confirmação de Email

```bash
# 1. Registre um novo usuário
https://zapcorte.com.br/register

# 2. Verifique o email recebido
# O link deve ser um destes formatos:
# - https://zapcorte.com.br/auth/confirm?token_hash=...&type=email
# - https://zapcorte.com.br/auth/confirm?token=123456

# 3. Clique no link
# Deve redirecionar para: /login?confirmed=true

# 4. Veja o toast: "Email confirmado!"
```

### Teste 2: Redefinição de Senha

```bash
# 1. Acesse
https://zapcorte.com.br/forgot-password

# 2. Digite seu email e envie

# 3. Verifique o email recebido
# O link deve ser um destes formatos:
# - https://zapcorte.com.br/auth/confirm?token_hash=...&type=recovery
# - https://zapcorte.com.br/auth/confirm?token=123456&type=recovery

# 4. Clique no link
# Deve redirecionar para: /auth/reset-password

# 5. Defina nova senha
# Deve redirecionar para: /login?reset=success
```

## 🔍 Verificar Qual Formato Está Sendo Usado

### Método 1: Verificar no Email

Quando receber um email de confirmação, verifique o link:

```
Se tiver "token_hash" → Está usando PKCE ✅
Se tiver "token" → Está usando OTP ✅
```

### Método 2: Verificar no Console do Supabase

1. Acesse: **Authentication** → **Logs**
2. Procure por eventos de "signup" ou "password_recovery"
3. Verifique o formato do token enviado

## 🎯 Qual Formato Usar?

### PKCE (token_hash) - Recomendado ✅

**Vantagens:**
- Mais seguro
- Token único e longo
- Padrão moderno
- Melhor para produção

**Use quando:**
- Configurando um novo projeto
- Quer máxima segurança
- Não tem restrições de compatibilidade

### OTP (token) - Compatibilidade ✅

**Vantagens:**
- Mais simples
- Token curto (6 dígitos)
- Funciona em qualquer cliente
- Fácil de digitar manualmente

**Use quando:**
- Já está configurado assim
- Precisa de compatibilidade
- Usuários podem digitar o código

## 🚨 Problemas Comuns

### Problema 1: Link não funciona

**Sintomas:**
- Clica no link e nada acontece
- Erro 404 ou página em branco

**Soluções:**
1. Verifique se a Site URL está correta
2. Verifique se as Redirect URLs estão configuradas
3. Limpe o cache do navegador
4. Tente em modo anônimo

### Problema 2: Token inválido

**Sintomas:**
- Mensagem "Token inválido ou expirado"
- Erro ao validar

**Soluções:**
1. Solicite um novo email
2. Use o link imediatamente após receber
3. Verifique se o template está correto
4. Verifique os logs do Supabase

### Problema 3: Não redireciona

**Sintomas:**
- Fica na página de confirmação
- Não vai para login

**Soluções:**
1. Verifique o console do navegador (F12)
2. Veja os logs de debug
3. Verifique se o código está atualizado
4. Faça um hard refresh (Ctrl+Shift+R)

## 📊 Fluxo Completo

### Confirmação de Email

```
1. Usuário se registra
   ↓
2. Supabase envia email
   Link: /auth/confirm?token_hash=...&type=email
   ou: /auth/confirm?token=123456
   ↓
3. Usuário clica no link
   ↓
4. AuthConfirm valida token
   - Tenta verifyOtp com token_hash
   - Tenta verifyOtp com token
   - Tenta exchangeCodeForSession
   ↓
5. Redireciona para /login?confirmed=true
   ↓
6. Mostra toast "Email confirmado!"
```

### Redefinição de Senha

```
1. Usuário acessa /forgot-password
   ↓
2. Digite email e envia
   ↓
3. Supabase envia email
   Link: /auth/confirm?token_hash=...&type=recovery
   ou: /auth/confirm?token=123456&type=recovery
   ↓
4. Usuário clica no link
   ↓
5. AuthConfirm valida token de recovery
   - Usa verifyOtp com type: 'recovery'
   - Cria sessão temporária
   ↓
6. Redireciona para /auth/reset-password
   ↓
7. Usuário define nova senha
   ↓
8. Sistema atualiza senha
   ↓
9. Faz logout
   ↓
10. Redireciona para /login?reset=success
   ↓
11. Mostra toast "Senha redefinida!"
```

## ✅ Checklist de Configuração

- [ ] Site URL configurada: `https://zapcorte.com.br`
- [ ] Redirect URLs adicionadas
- [ ] Template "Confirm Signup" configurado
- [ ] Template "Reset Password" configurado
- [ ] Testado confirmação de email
- [ ] Testado redefinição de senha
- [ ] Verificado logs no console
- [ ] Verificado emails chegam
- [ ] Verificado links funcionam

## 🎉 Resumo

**Para Confirmação de Email:**
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
ou
{{ .SiteURL }}/auth/confirm?token={{ .Token }}
```

**Para Redefinição de Senha:**
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
ou
{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery
```

**Ambos os formatos funcionam!** O código está preparado para lidar com os dois. ✅
