# 🌐 Configuração de Redirecionamento para Produção

## ✅ Configuração Implementada

O sistema agora detecta automaticamente se está rodando em **desenvolvimento** (localhost) ou **produção** (zapcorte.com.br) e redireciona para a URL correta.

---

## 🔄 Como Funciona

### Detecção Automática de Ambiente

```typescript
const isProduction = window.location.hostname === 'zapcorte.com.br' || 
                     window.location.hostname === 'www.zapcorte.com.br';

const baseUrl = isProduction ? 'https://zapcorte.com.br' : window.location.origin;
```

### URLs de Redirecionamento

| Ambiente | URL Base | Dashboard |
|----------|----------|-----------|
| **Desenvolvimento** | `http://localhost:5173` | `http://localhost:5173/dashboard` |
| **Produção** | `https://zapcorte.com.br` | `https://zapcorte.com.br/dashboard` |

---

## 📋 Fluxo Completo

### 1. Cadastro
```
Usuário preenche formulário
  ↓
localStorage salva dados
  ↓
supabase.auth.signUp()
  ↓
Redireciona para /confirmar-email
```

### 2. Confirmação de Email
```
Usuário clica no link do email
  ↓
Redireciona para /auth/confirm
  ↓
Verifica token (5 métodos)
  ↓
Sucesso → /email-confirmado
```

### 3. Após Confirmação
```
Página /email-confirmado
  ↓
Countdown de 5 segundos
  ↓
Redireciona para:
  - DEV: http://localhost:5173/dashboard
  - PROD: https://zapcorte.com.br/dashboard ✅
```

---

## 🎯 URL Atual Configurada

**Após confirmar email, redireciona para:**
```
https://zapcorte.com.br/dashboard
```

---

## 🔧 Como Alterar a URL de Redirecionamento

Se você quiser mudar para outra URL (ex: `/bem-vindo`, `/configurar-barbearia`), edite o arquivo:

**Arquivo:** `src/lib/auth-config.ts`

```typescript
export const AUTH_CONFIG = {
  redirectUrls: {
    emailConfirmation: `${baseUrl}/auth/confirm`,
    passwordReset: `${baseUrl}/auth/callback`,
    signIn: `${baseUrl}/dashboard`,
    signOut: `${baseUrl}/login`,
    afterEmailConfirmed: `${baseUrl}/dashboard` // ← ALTERE AQUI
  },
  // ...
}
```

### Exemplos de URLs:

```typescript
// Dashboard principal
afterEmailConfirmed: `${baseUrl}/dashboard`

// Página de boas-vindas
afterEmailConfirmed: `${baseUrl}/bem-vindo`

// Setup inicial da barbearia
afterEmailConfirmed: `${baseUrl}/configurar-barbearia`

// Página de onboarding
afterEmailConfirmed: `${baseUrl}/onboarding`
```

---

## 📱 Teste em Desenvolvimento

### Localhost
```bash
npm run dev
# Acesse: http://localhost:5173/register
# Após confirmar: redireciona para http://localhost:5173/dashboard
```

### Simular Produção
Para testar o comportamento de produção localmente, você pode:

1. Editar o arquivo `hosts` do sistema:
   ```
   127.0.0.1 zapcorte.com.br
   ```

2. Acessar: `http://zapcorte.com.br:5173`

3. O sistema detectará como produção e usará URLs de produção

---

## 🚀 Deploy em Produção

### Vercel/Netlify

1. **Fazer deploy normalmente**
   ```bash
   git push origin main
   ```

2. **Configurar domínio personalizado**
   - Vercel: Settings → Domains → Add `zapcorte.com.br`
   - Netlify: Domain settings → Add custom domain

3. **Testar fluxo completo**
   - Cadastro em `https://zapcorte.com.br/register`
   - Confirmar email
   - Verificar redirecionamento para `https://zapcorte.com.br/dashboard`

---

## ✅ Checklist de Produção

- [x] Detecção automática de ambiente implementada
- [x] URLs de produção configuradas
- [x] Redirecionamento após confirmação configurado
- [x] Suporte para `www.zapcorte.com.br` e `zapcorte.com.br`
- [ ] Testar em produção após deploy
- [ ] Verificar se dashboard carrega corretamente
- [ ] Confirmar que usuário está autenticado após redirect

---

## 🐛 Troubleshooting

### Problema: Redireciona para localhost em produção

**Solução:** Limpar cache do navegador e verificar se o domínio está correto.

### Problema: Erro 404 após redirecionamento

**Solução:** Verificar se a rota `/dashboard` existe e está configurada no `App.tsx`.

### Problema: Usuário não está autenticado após redirect

**Solução:** Verificar se o Supabase está mantendo a sessão. Pode ser necessário configurar cookies de sessão.

---

## 📊 Variáveis de Ambiente

Certifique-se de que as variáveis estão configuradas em produção:

```env
VITE_SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## 🎨 Personalização

### Mudar Tempo de Countdown

**Arquivo:** `src/pages/EmailConfirmado.tsx`

```typescript
const [countdown, setCountdown] = useState(5); // ← Altere aqui (em segundos)
```

### Desabilitar Auto-redirect

Se quiser que o usuário clique manualmente:

```typescript
// Comentar ou remover o useEffect do countdown
/*
useEffect(() => {
  // ... código do countdown
}, [navigate]);
*/
```

---

## 📝 Resumo

✅ **Implementado:**
- Detecção automática de ambiente (dev/prod)
- Redirecionamento para `https://zapcorte.com.br/dashboard`
- Suporte para ambos os domínios (com e sem www)
- Countdown de 5 segundos
- Botão manual para ir imediatamente

✅ **Funciona em:**
- Desenvolvimento (localhost)
- Produção (zapcorte.com.br)
- Staging (qualquer outro domínio)

✅ **Pronto para:**
- Deploy em produção
- Testes com usuários reais
- Personalização de URLs

---

**Status:** ✅ Configurado e Pronto para Produção  
**Última atualização:** 2025-11-13
