# 🔐 Guia Completo de Segurança - ZapCorte

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Segurança do Banco de Dados](#segurança-do-banco-de-dados)
3. [Segurança do Frontend](#segurança-do-frontend)
4. [Segurança do Backend](#segurança-do-backend)
5. [Validação de Inputs](#validação-de-inputs)
6. [Proteção de API Keys](#proteção-de-api-keys)
7. [Headers de Segurança](#headers-de-segurança)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Visão Geral

Este guia implementa múltiplas camadas de segurança para proteger o ZapCorte contra:

- ✅ **SQL Injection** - Validação e sanitização de inputs
- ✅ **Acesso não autorizado** - RLS e políticas restritivas
- ✅ **XSS (Cross-Site Scripting)** - Sanitização de HTML
- ✅ **CSRF (Cross-Site Request Forgery)** - Tokens e validação
- ✅ **Vazamento de dados** - Criptografia e controle de acesso
- ✅ **Ataques de força bruta** - Rate limiting
- ✅ **Clickjacking** - Headers de segurança

---

## 🗄️ Segurança do Banco de Dados

### 1. Ativar RLS (Row-Level Security)

**Executar script:**
```bash
# No Supabase SQL Editor
psql -f security/01_enable_rls.sql
```

**Tabelas protegidas:**
- ✅ `users` - Dados de autenticação
- ✅ `barbershops` - Dados das barbearias
- ✅ `services` - Serviços oferecidos
- ✅ `appointments` - Agendamentos
- ✅ `availability` - Disponibilidade
- ✅ `customers` - Clientes (já ativo)
- ✅ `profiles` - Perfis (já ativo)
- ✅ `payment_history` - Pagamentos (já ativo)
- ✅ `reminder_jobs` - Lembretes
- ✅ `webhook_logs` - Logs de webhooks

### 2. Criar Políticas de Acesso

**Executar script:**
```bash
psql -f security/02_create_policies.sql
```

**Políticas implementadas:**

#### Barbeiros
- ✅ Veem apenas suas próprias barbearias
- ✅ Gerenciam apenas seus serviços
- ✅ Acessam apenas seus agendamentos
- ✅ Controlam apenas seus clientes

#### Público (Clientes)
- ✅ Veem apenas barbearias ativas
- ✅ Veem apenas serviços ativos
- ✅ Podem criar agendamentos
- ✅ Não veem dados de outros clientes

#### Service Role (Backend)
- ✅ Acesso total para webhooks
- ✅ Gerencia lembretes automatizados
- ✅ Acessa logs do sistema

### 3. Validação de Inputs

**Executar script:**
```bash
psql -f security/03_input_validation.sql
```

**Validações implementadas:**

#### Telefone
```sql
CHECK (phone ~ '^[0-9]{10,11}$')
```

#### Email
```sql
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

#### URL
```sql
CHECK (url ~ '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$')
```

#### Preço
```sql
CHECK (price >= 0 AND price <= 10000)
```

#### Duração
```sql
CHECK (duration >= 5 AND duration <= 480)
```

### 4. Sanitização Automática

**Triggers criados:**
- ✅ `trigger_sanitize_appointment` - Remove HTML e caracteres perigosos
- ✅ `trigger_sanitize_service` - Limpa nome e descrição
- ✅ `trigger_sanitize_barbershop` - Normaliza slug e telefone

---

## 🎨 Segurança do Frontend

### 1. Validação com Zod

**Instalar dependência:**
```bash
npm install zod
```

**Exemplo de validação:**
```typescript
import { z } from 'zod';

// Schema para agendamento
const appointmentSchema = z.object({
  customer_name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome inválido'),
  
  customer_phone: z.string()
    .regex(/^[0-9]{10,11}$/, 'Telefone inválido (10-11 dígitos)'),
  
  scheduled_at: z.date()
    .min(new Date(), 'Data deve ser no futuro'),
  
  service_id: z.string().uuid('ID de serviço inválido')
});

// Uso
try {
  const validData = appointmentSchema.parse(formData);
  // Prosseguir com dados validados
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Erros de validação:', error.errors);
  }
}
```

### 2. Sanitização de HTML

**Instalar dependência:**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Exemplo de uso:**
```typescript
import DOMPurify from 'dompurify';

// Sanitizar antes de exibir
const sanitizedHTML = DOMPurify.sanitize(userInput);

// Exibir com segurança
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### 3. Proteção contra XSS

**Nunca fazer:**
```typescript
// ❌ PERIGOSO - Não fazer!
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Sempre fazer:**
```typescript
// ✅ SEGURO
<div>{userInput}</div>  // React escapa automaticamente

// ✅ SEGURO com sanitização
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 4. Validação de Telefone

**Componente de input:**
```typescript
import { useState } from 'react';

function PhoneInput({ value, onChange }) {
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, ''); // Remove não-dígitos
    
    if (phone.length > 11) {
      setError('Telefone deve ter no máximo 11 dígitos');
      return;
    }
    
    if (phone.length > 0 && phone.length < 10) {
      setError('Telefone deve ter 10 ou 11 dígitos');
    } else {
      setError('');
    }
    
    onChange(phone);
  };

  return (
    <div>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="(00) 00000-0000"
        maxLength={11}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### 5. Proteção de Rotas

**Exemplo com React Router:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Uso
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 🔧 Segurança do Backend

### 1. Validação no Servidor (Express)

**Instalar dependências:**
```bash
cd server
npm install express-validator helmet express-rate-limit
```

**Exemplo de validação:**
```javascript
import { body, validationResult } from 'express-validator';

// Middleware de validação
const validateAppointment = [
  body('customer_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome inválido'),
  
  body('customer_phone')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Telefone inválido'),
  
  body('scheduled_at')
    .isISO8601()
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Data deve ser no futuro');
      }
      return true;
    }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Uso
app.post('/api/appointments', validateAppointment, async (req, res) => {
  // Dados já validados
  const { customer_name, customer_phone, scheduled_at } = req.body;
  // ...
});
```

### 2. Rate Limiting

**Configuração:**
```javascript
import rateLimit from 'express-rate-limit';

// Limitar criação de agendamentos
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requisições por IP
  message: 'Muitas tentativas de agendamento. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitar tentativas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
});

// Uso
app.post('/api/appointments', appointmentLimiter, validateAppointment, createAppointment);
app.post('/api/auth/login', loginLimiter, login);
```

### 3. Headers de Segurança (Helmet)

**Configuração:**
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://ihwkbflhxvdsewifofdk.supabase.co"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));
```

### 4. CORS Configuração

**Configuração segura:**
```javascript
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://zapcorte.com.br', 'https://www.zapcorte.com.br']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## 🔑 Proteção de API Keys

### 1. Variáveis de Ambiente

**Arquivo `.env.example`:**
```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# Cakto (NUNCA expor no frontend)
CAKTO_WEBHOOK_SECRET=seu_secret_aqui
CAKTO_PRODUCT_ID_STARTER=seu_product_id

# Evolution API (NUNCA expor no frontend)
EVOLUTION_API_KEY=sua_api_key_aqui
EVOLUTION_API_URL=https://sua-evolution-api.com

# OneSignal (NUNCA expor no frontend)
ONESIGNAL_APP_ID=seu_app_id
ONESIGNAL_REST_API_KEY=sua_rest_api_key
```

**Arquivo `.gitignore`:**
```
# Variáveis de ambiente
.env
.env.local
.env.production
.env.development

# Chaves e secrets
*.key
*.pem
secrets/
```

### 2. Separação de Keys

**Frontend (`.env.local`):**
```env
# ✅ SEGURO - Pode expor no frontend
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/3th8tvh
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/9jk3ref
```

**Backend (`server/.env`):**
```env
# ❌ NUNCA expor no frontend
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
CAKTO_WEBHOOK_SECRET=seu_webhook_secret
EVOLUTION_API_KEY=sua_evolution_api_key
ONESIGNAL_REST_API_KEY=sua_onesignal_key
```

### 3. Verificação de Keys

**Script de verificação:**
```bash
#!/bin/bash
# check-secrets.sh

echo "🔍 Verificando se secrets estão expostos..."

# Verificar se .env está no .gitignore
if ! grep -q "^\.env$" .gitignore; then
  echo "❌ ERRO: .env não está no .gitignore!"
  exit 1
fi

# Verificar se há secrets commitados
if git grep -E "(SUPABASE_SERVICE_ROLE_KEY|CAKTO_WEBHOOK_SECRET|EVOLUTION_API_KEY)" HEAD; then
  echo "❌ ERRO: Secrets encontrados no repositório!"
  exit 1
fi

echo "✅ Nenhum secret exposto"
```

---

## 🛡️ Headers de Segurança

### 1. Configuração no Vercel

**Arquivo `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ihwkbflhxvdsewifofdk.supabase.co; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

### 2. Configuração no Nginx

**Arquivo `nginx.conf`:**
```nginx
server {
    listen 443 ssl http2;
    server_name zapcorte.com.br;

    # Headers de segurança
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;

    # SSL
    ssl_certificate /etc/letsencrypt/live/zapcorte.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zapcorte.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Monitoramento e Logs

### 1. Logs de Segurança

**Tabela de audit log:**
```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at);
CREATE INDEX idx_security_audit_action ON security_audit_log(action);
```

**Função para registrar ações:**
```sql
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    resource,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_action,
    p_resource,
    p_success,
    p_error_message
  );
END;
$$ LANGUAGE plpgsql;
```

### 2. Monitoramento de Tentativas Suspeitas

**Query para detectar atividades suspeitas:**
```sql
-- Múltiplas tentativas de login falhadas
SELECT 
  user_id,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM security_audit_log
WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) >= 5;

-- Acessos de IPs diferentes em curto período
SELECT 
  user_id,
  COUNT(DISTINCT ip_address) as different_ips,
  array_agg(DISTINCT ip_address) as ips
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) >= 3;
```

---

## ✅ Checklist de Segurança

### Banco de Dados
- [ ] RLS ativo em todas as tabelas sensíveis
- [ ] Políticas restritivas criadas
- [ ] Validações de input implementadas
- [ ] Sanitização automática configurada
- [ ] Rate limiting implementado
- [ ] Audit log configurado

### Frontend
- [ ] Validação com Zod implementada
- [ ] Sanitização de HTML (DOMPurify)
- [ ] Proteção contra XSS
- [ ] Rotas protegidas
- [ ] Inputs validados antes de enviar
- [ ] Mensagens de erro genéricas (não expor detalhes)

### Backend
- [ ] Validação de inputs no servidor
- [ ] Rate limiting configurado
- [ ] Headers de segurança (Helmet)
- [ ] CORS configurado corretamente
- [ ] Logs de segurança implementados
- [ ] Webhook com validação de assinatura

### API Keys e Secrets
- [ ] `.env` no `.gitignore`
- [ ] Keys separadas (frontend/backend)
- [ ] Service role key apenas no backend
- [ ] Secrets não commitados
- [ ] `.env.example` documentado

### Headers e HTTPS
- [ ] HTTPS ativo em produção
- [ ] Headers de segurança configurados
- [ ] CSP (Content Security Policy) implementado
- [ ] HSTS ativo
- [ ] X-Frame-Options configurado

### Monitoramento
- [ ] Logs de segurança ativos
- [ ] Alertas para atividades suspeitas
- [ ] Backup regular do banco
- [ ] Plano de resposta a incidentes

---

## 🚀 Implementação Rápida

### Passo 1: Banco de Dados (5 min)
```bash
# No Supabase SQL Editor
1. Executar: security/01_enable_rls.sql
2. Executar: security/02_create_policies.sql
3. Executar: security/03_input_validation.sql
```

### Passo 2: Frontend (10 min)
```bash
npm install zod dompurify
npm install --save-dev @types/dompurify
```

### Passo 3: Backend (10 min)
```bash
cd server
npm install express-validator helmet express-rate-limit
```

### Passo 4: Configurar Headers (5 min)
- Adicionar `vercel.json` com headers de segurança

### Passo 5: Testar (10 min)
- Testar RLS
- Testar validações
- Testar rate limiting

**Total: ~40 minutos para implementação completa**

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do Supabase
2. Verificar console do navegador
3. Verificar logs do servidor
4. Consultar documentação do Supabase sobre RLS

---

**🔐 SEGURANÇA É PRIORIDADE! 🔐**

**Desenvolvido com ❤️ para ZapCorte**  
**Data:** 11 de Novembro de 2025
