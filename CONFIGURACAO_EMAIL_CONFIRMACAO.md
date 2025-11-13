# 📧 Configuração do Sistema de Confirmação de Email - ZapCorte

## ✅ Arquivos Criados

### 1. Configuração
- ✅ `src/lib/auth-config.ts` - Configurações de URLs e redirecionamento

### 2. Páginas
- ✅ `src/pages/ConfirmarEmail.tsx` - Página de aguardo de confirmação
- ✅ `src/pages/EmailConfirmado.tsx` - Página de sucesso
- ✅ `src/pages/AuthConfirm.tsx` - Rota principal de callback (5 métodos)
- ✅ `src/pages/AuthCallback.tsx` - Rota alternativa de callback
- ✅ `src/pages/AuthVerify.tsx` - Rota de debug

### 3. Atualizações
- ✅ `src/pages/Register.tsx` - Adicionado campos nome e telefone + localStorage
- ✅ `src/App.tsx` - Adicionadas 5 novas rotas

## 🔧 Configuração Manual Necessária

### 1. Supabase Dashboard - Authentication Settings

Acesse: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/url-configuration

#### Site URL
```
https://zapcorte.com.br
```

#### Redirect URLs (adicionar todas)

**Desenvolvimento:**
```
http://localhost:5173/auth/callback
http://localhost:5173/auth/verify
http://localhost:5173/auth/confirm
http://localhost:5173/dashboard
http://localhost:5173/email-confirmado
```

**Produção:**
```
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
```

### 2. Verificar Tabela `barbeiros`

Certifique-se de que a tabela `barbeiros` existe com a estrutura:

```sql
CREATE TABLE IF NOT EXISTS barbeiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  status TEXT DEFAULT 'ativo',
  plano TEXT DEFAULT 'freemium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_barbeiros_auth_id ON barbeiros(auth_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_email ON barbeiros(email);
```

### 3. Habilitar Confirmação de Email

No Supabase Dashboard > Authentication > Email Auth:
- ✅ Marcar "Enable email confirmations"
- ✅ Configurar template de email (opcional)

## 🔄 Fluxo Completo

### 1. Cadastro
```
Usuário preenche formulário
  ↓
Dados salvos no localStorage
  ↓
supabase.auth.signUp() com emailRedirectTo
  ↓
Redireciona para /confirmar-email
```

### 2. Confirmação
```
Usuário clica no link do email
  ↓
Redireciona para /auth/confirm (ou /auth/callback)
  ↓
5 métodos de verificação tentados:
  1. verifyOtp com token_hash
  2. exchangeCodeForSession com token_hash
  3. verifyOtp com token
  4. exchangeCodeForSession com code
  5. Verificar sessão atual
  ↓
Se sucesso: cria barbeiro no banco
  ↓
Redireciona para /email-confirmado
  ↓
Auto-redirect para /login após 5s
```

### 3. Criação do Barbeiro
```
Recupera dados do localStorage
  ↓
Verifica se barbeiro já existe
  ↓
Se não existe: cria com retry (3 tentativas)
  ↓
Remove dados do localStorage
  ↓
Ignora erros de duplicata
```

## 🎨 Design

Todas as páginas seguem o padrão ZapCorte:
- **Cores:** Verde #22c55e, #16a34a e Dark #1a4d2e, #0d2818
- **Logo:** https://www.zapcorte.com.br/assets/zapcorte-icon-DS8CtXCp.png
- **Responsivo:** Mobile-first com Tailwind CSS
- **Animações:** Transições suaves e feedback visual

## 🧪 Como Testar

### Teste Local

1. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

2. Acessar: http://localhost:5173/register

3. Preencher formulário e cadastrar

4. Verificar email (pode estar no spam)

5. Clicar no link de confirmação

6. Verificar se foi redirecionado para /email-confirmado

7. Verificar se barbeiro foi criado no banco

### Teste de Debug

Acesse: http://localhost:5173/auth/verify

Esta página mostra:
- URL completa
- Parâmetros de busca
- Parâmetros do hash
- Sessão atual
- Usuário atual
- Log de tentativas

## 🔍 Troubleshooting

### Email não chega
- Verificar pasta de spam
- Verificar configurações SMTP no Supabase
- Usar botão "Reenviar email" (cooldown de 60s)

### Token expirado
- Tokens expiram em 24h
- Usar botão "Reenviar email" na página de erro

### Barbeiro não é criado
- Verificar logs no console do navegador
- Sistema tem retry automático (3 tentativas)
- Erros de duplicata são ignorados

### Erro de redirect URL
- Verificar se todas as URLs estão configuradas no Supabase
- Verificar se o domínio está correto

## 📊 Logs e Monitoramento

### Console do Navegador
Todos os processos têm logs detalhados:
- `[AuthConfirm]` - Processo de confirmação principal
- `[AuthCallback]` - Processo de callback alternativo
- `[AuthVerify]` - Debug detalhado

### Exemplo de logs bem-sucedidos:
```
[AuthConfirm] Parâmetros recebidos: token_hash=true, token=false, code=false, type=email
[AuthConfirm] Tentativa 1: verifyOtp com token_hash
[AuthConfirm] ✅ Sucesso com verifyOtp + token_hash
```

## 🚀 Deploy

### Variáveis de Ambiente
Certifique-se de que estão configuradas:
```env
VITE_SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Vercel/Netlify
As rotas são client-side, então funcionam automaticamente com SPA routing.

## 📝 Checklist Final

- [ ] Configurar URLs no Supabase Dashboard
- [ ] Verificar tabela `barbeiros` existe
- [ ] Habilitar confirmação de email no Supabase
- [ ] Testar cadastro local
- [ ] Testar confirmação de email
- [ ] Verificar criação do barbeiro no banco
- [ ] Testar em produção
- [ ] Verificar emails em produção

## 🎯 Próximos Passos (Opcional)

1. **Webhook Backend** - Criar barbeiro automaticamente via webhook
2. **Template de Email** - Personalizar email de confirmação
3. **Analytics** - Rastrear taxa de confirmação
4. **Notificações** - Alertar admin sobre novos cadastros

---

**Status:** ✅ Implementação completa
**Última atualização:** 2025-11-13
