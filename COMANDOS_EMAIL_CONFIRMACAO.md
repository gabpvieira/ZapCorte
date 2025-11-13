# ⚡ Comandos Rápidos - Sistema de Confirmação de Email

## 🚀 Início Rápido (3 passos)

### 1. Configurar Supabase (1 minuto)
```
1. Abrir: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/url-configuration

2. Site URL:
   https://zapcorte.com.br

3. Redirect URLs (copiar TODAS):
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/verify
   http://localhost:5173/auth/confirm
   http://localhost:5173/dashboard
   http://localhost:5173/email-confirmado
   https://zapcorte.com.br/auth/callback
   https://zapcorte.com.br/auth/verify
   https://zapcorte.com.br/auth/confirm
   https://zapcorte.com.br/dashboard
   https://zapcorte.com.br/email-confirmado
   https://www.zapcorte.com.br/auth/callback
   https://www.zapcorte.com.br/auth/verify
   https://www.zapcorte.com.br/auth/confirm
   https://www.zapcorte.com.br/dashboard
   https://www.zapcorte.com.br/email-confirmado

4. Salvar
```

### 2. Criar Tabela (30 segundos)
```
1. Abrir: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/sql/new

2. Copiar conteúdo de: migrations/create_barbeiros_table.sql

3. Colar e executar (RUN)
```

### 3. Habilitar Confirmação (15 segundos)
```
1. Abrir: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/providers

2. Email → Enable email confirmations ✅

3. Salvar
```

---

## 🧪 Testar (2 minutos)

### Teste Local
```bash
# Terminal 1: Iniciar servidor
cd zap-corte-pro-main
npm run dev

# Navegador:
# 1. Abrir: http://localhost:5173/register
# 2. Cadastrar com email real
# 3. Verificar email
# 4. Clicar no link
# 5. Verificar redirecionamento
```

### Verificar Banco
```
1. Abrir: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/editor

2. Tabela: barbeiros

3. Verificar novo registro
```

---

## 🐛 Debug Rápido

### Ver Logs
```javascript
// Console do navegador (F12)
// Filtrar por: [AuthConfirm]
```

### Página de Debug
```
http://localhost:5173/auth/verify
```

### Verificar localStorage
```javascript
// Console do navegador
localStorage.getItem('pendingUserData')
```

---

## 🔧 Comandos Úteis

### Limpar Cache
```javascript
// Console do navegador
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Reenviar Email Manualmente
```javascript
// Console do navegador
const { supabase } = await import('./src/lib/supabase')
await supabase.auth.resend({
  type: 'signup',
  email: 'seu-email@exemplo.com'
})
```

### Verificar Sessão
```javascript
// Console do navegador
const { supabase } = await import('./src/lib/supabase')
const { data } = await supabase.auth.getSession()
console.log(data)
```

---

## 📊 Verificações Rápidas

### ✅ Checklist de Configuração
```
[ ] URLs configuradas no Supabase
[ ] Tabela barbeiros criada
[ ] Confirmação de email habilitada
[ ] Servidor rodando (npm run dev)
```

### ✅ Checklist de Teste
```
[ ] Cadastro funciona
[ ] Email chega
[ ] Link funciona
[ ] Redirecionamento correto
[ ] Barbeiro criado no banco
[ ] Login funciona
```

---

## 🚨 Problemas Comuns (Soluções Rápidas)

### Email não chega
```
1. Verificar spam
2. Aguardar 2-3 minutos
3. Usar botão "Reenviar email"
4. Verificar se email é válido
```

### Token inválido
```
1. Verificar URLs no Supabase
2. Limpar cache do navegador
3. Reenviar email
```

### Barbeiro não criado
```
1. Abrir console (F12)
2. Verificar logs
3. Verificar tabela existe
4. Sistema tem retry automático
```

### Erro de redirect
```
1. Verificar todas as URLs no Supabase
2. Verificar http vs https
3. Limpar cache
```

---

## 📱 URLs Importantes

### Desenvolvimento
```
Cadastro:     http://localhost:5173/register
Confirmação:  http://localhost:5173/confirmar-email
Sucesso:      http://localhost:5173/email-confirmado
Login:        http://localhost:5173/login
Debug:        http://localhost:5173/auth/verify
```

### Produção
```
Cadastro:     https://zapcorte.com.br/register
Confirmação:  https://zapcorte.com.br/confirmar-email
Sucesso:      https://zapcorte.com.br/email-confirmado
Login:        https://zapcorte.com.br/login
```

### Supabase Dashboard
```
Projeto:      https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk
Auth Config:  https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/url-configuration
SQL Editor:   https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/sql/new
Table Editor: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/editor
Auth Users:   https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/users
```

---

## 🎯 Fluxo Visual Rápido

```
CADASTRO
   ↓
/register
   ↓
Preencher formulário
   ↓
Salvar no localStorage
   ↓
supabase.auth.signUp()
   ↓
/confirmar-email
   ↓
Verificar email
   ↓
Clicar no link
   ↓
/auth/confirm
   ↓
5 métodos de verificação
   ↓
Criar barbeiro (3 tentativas)
   ↓
/email-confirmado
   ↓
Countdown 5s
   ↓
/login
   ↓
✅ SUCESSO
```

---

## 📚 Documentação Completa

```
RESUMO_SISTEMA_EMAIL.md
  → Visão geral completa

CONFIGURACAO_EMAIL_CONFIRMACAO.md
  → Guia de configuração detalhado

TESTE_EMAIL_CONFIRMACAO.md
  → 10 testes passo a passo

COMANDOS_EMAIL_CONFIRMACAO.md (este arquivo)
  → Comandos rápidos
```

---

## ⚡ One-Liner para Teste Completo

```bash
# Copiar e colar no terminal
cd zap-corte-pro-main && npm run dev
```

Depois:
1. Abrir http://localhost:5173/register
2. Cadastrar
3. Verificar email
4. Clicar no link
5. ✅ Pronto!

---

**Tempo total de configuração:** ~2 minutos  
**Tempo total de teste:** ~2 minutos  
**Total:** ~4 minutos para sistema completo funcionando! 🚀
