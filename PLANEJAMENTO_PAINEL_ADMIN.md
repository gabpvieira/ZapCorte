# Planejamento: Painel Administrativo SaaS

## Objetivo
Criar um painel administrativo completo para o dono do SaaS monitorar métricas de performance, usuários, receita e outras estatísticas importantes.

## 1. Estrutura de Banco de Dados

### 1.1. Tabela: `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT admin_email_check CHECK (email = 'eugabrieldpv@gmail.com')
);
```

### 1.2. View: `admin_metrics_daily`
```sql
CREATE VIEW admin_metrics_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as new_users,
  COUNT(*) as new_profiles,
  COUNT(CASE WHEN plan_type = 'starter' THEN 1 END) as starter_users,
  COUNT(CASE WHEN plan_type = 'pro' THEN 1 END) as pro_users
FROM profiles
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 1.3. View: `admin_revenue_metrics`
```sql
CREATE VIEW admin_revenue_metrics AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  plan_type,
  COUNT(*) as subscriptions,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_revenue
FROM payment_history
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at), plan_type
ORDER BY month DESC;
```

### 1.4. View: `admin_user_stats`
```sql
CREATE VIEW admin_user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN plan_type = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN plan_type = 'starter' THEN 1 END) as starter_users,
  COUNT(CASE WHEN plan_type = 'pro' THEN 1 END) as pro_users,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_today
FROM profiles;
```

### 1.5. View: `admin_barbershop_stats`
```sql
CREATE VIEW admin_barbershop_stats AS
SELECT 
  COUNT(*) as total_barbershops,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_barbershops,
  COUNT(CASE WHEN plan_type = 'freemium' THEN 1 END) as freemium_barbershops,
  COUNT(CASE WHEN plan_type = 'starter' THEN 1 END) as starter_barbershops,
  COUNT(CASE WHEN plan_type = 'pro' THEN 1 END) as pro_barbershops,
  AVG(monthly_appointment_count) as avg_appointments_per_barbershop
FROM barbershops;
```

### 1.6. View: `admin_appointment_stats`
```sql
CREATE VIEW admin_appointment_stats AS
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN DATE(scheduled_at) = CURRENT_DATE THEN 1 END) as today_appointments,
  COUNT(CASE WHEN DATE(scheduled_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_appointments,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
  COUNT(CASE WHEN is_fit_in = true THEN 1 END) as fit_in_appointments
FROM appointments;
```

## 2. Estrutura de Arquivos

```
src/
├── pages/
│   └── admin/
│       ├── AdminLogin.tsx          # Página de login admin
│       ├── AdminDashboard.tsx      # Dashboard principal
│       └── AdminLayout.tsx         # Layout do painel admin
├── hooks/
│   └── useAdminAuth.tsx            # Hook de autenticação admin
├── lib/
│   └── admin-queries.ts            # Queries específicas do admin
└── contexts/
    └── AdminAuthContext.tsx        # Context de autenticação admin
```

## 3. Funcionalidades do Painel

### 3.1. Métricas Principais (Cards)
- **Total de Usuários**: Quantidade total de usuários cadastrados
- **Usuários Ativos**: Usuários com assinatura ativa
- **MRR (Monthly Recurring Revenue)**: Receita recorrente mensal
- **Novos Usuários (Hoje)**: Usuários cadastrados hoje
- **Taxa de Conversão**: % de usuários free que viraram pagantes
- **Churn Rate**: Taxa de cancelamento

### 3.2. Gráficos
1. **Gráfico de Crescimento de Usuários** (Linha)
   - Eixo X: Dias/Meses
   - Eixo Y: Número de usuários
   - Séries: Total, Free, Starter, Pro

2. **Gráfico de Receita** (Barra)
   - Eixo X: Meses
   - Eixo Y: Valor em R$
   - Séries: Starter, Pro, Total

3. **Gráfico de Distribuição de Planos** (Pizza)
   - Free, Starter, Pro

4. **Gráfico de Agendamentos** (Linha)
   - Eixo X: Dias
   - Eixo Y: Número de agendamentos
   - Séries: Total, Confirmados, Cancelados

### 3.3. Tabelas
1. **Últimos Usuários Cadastrados**
   - Email, Nome, Plano, Data de Cadastro, Status

2. **Últimas Transações**
   - Usuário, Plano, Valor, Status, Data

3. **Barbearias Mais Ativas**
   - Nome, Slug, Agendamentos do Mês, Plano

## 4. Segurança

### 4.1. Autenticação
- Login separado do sistema principal
- Verificação de email específico (eugabrieldpv@gmail.com)
- Token JWT com expiração de 24h
- Refresh token para renovação automática

### 4.2. Autorização
- RLS (Row Level Security) no Supabase
- Policies específicas para admin_users
- Middleware de verificação em todas as rotas admin

### 4.3. Rota Protegida
```typescript
// Rota: /admin/dashboard
// Acesso: Apenas eugabrieldpv@gmail.com
// Redirecionamento: Se não autenticado -> /admin/login
```

## 5. Design/UI

### 5.1. Cores
- Primária: Roxo (#8B5CF6) - mantém identidade visual
- Secundária: Azul escuro (#1E293B) - para admin
- Destaque: Verde (#10B981) - métricas positivas
- Alerta: Vermelho (#EF4444) - métricas negativas

### 5.2. Layout
```
┌─────────────────────────────────────────┐
│  Logo ZapCorte Admin    [User] [Logout] │
├─────────────────────────────────────────┤
│                                         │
│  📊 Dashboard  👥 Usuários  💰 Receita  │
│                                         │
├─────────────────────────────────────────┤
│  [Card MRR] [Card Users] [Card New]    │
│  [Card Active] [Card Churn] [Card Conv]│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Gráfico de Crescimento         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Gráfico      │  │ Gráfico      │   │
│  │ Receita      │  │ Distribuição │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  Últimos Usuários                       │
│  ┌─────────────────────────────────┐   │
│  │ Tabela com paginação            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 6. Tecnologias

- **Frontend**: React + TypeScript
- **UI**: Shadcn/ui (já em uso)
- **Gráficos**: Recharts (biblioteca leve e responsiva)
- **Autenticação**: Supabase Auth + Custom Admin Check
- **Queries**: Supabase MCP + React Query
- **Roteamento**: React Router (já em uso)

## 7. Implementação (Fases)

### Fase 1: Estrutura Base
1. Criar tabelas e views no Supabase
2. Configurar RLS e policies
3. Criar contexto de autenticação admin
4. Criar página de login admin

### Fase 2: Dashboard Principal
1. Criar layout admin
2. Implementar cards de métricas
3. Adicionar gráficos principais
4. Implementar atualização em tempo real

### Fase 3: Tabelas e Detalhes
1. Tabela de usuários
2. Tabela de transações
3. Tabela de barbearias
4. Filtros e paginação

### Fase 4: Funcionalidades Avançadas
1. Exportação de dados (CSV/Excel)
2. Filtros por período
3. Comparação de períodos
4. Alertas e notificações

## 8. Queries SQL Necessárias

### 8.1. MRR (Monthly Recurring Revenue)
```sql
SELECT 
  SUM(CASE 
    WHEN plan_type = 'starter' THEN 29.90
    WHEN plan_type = 'pro' THEN 49.90
    ELSE 0
  END) as mrr
FROM profiles
WHERE subscription_status = 'active';
```

### 8.2. Taxa de Conversão
```sql
SELECT 
  ROUND(
    (COUNT(CASE WHEN plan_type != 'free' THEN 1 END)::NUMERIC / 
     COUNT(*)::NUMERIC) * 100, 
    2
  ) as conversion_rate
FROM profiles;
```

### 8.3. Churn Rate (últimos 30 dias)
```sql
SELECT 
  ROUND(
    (COUNT(CASE WHEN subscription_status = 'cancelled' 
                 AND updated_at >= NOW() - INTERVAL '30 days' 
            THEN 1 END)::NUMERIC / 
     COUNT(CASE WHEN subscription_status = 'active' 
                 AND updated_at >= NOW() - INTERVAL '30 days' 
            THEN 1 END)::NUMERIC) * 100,
    2
  ) as churn_rate
FROM profiles;
```

## 9. Segurança Adicional

### 9.1. Variáveis de Ambiente
```env
VITE_ADMIN_EMAIL=eugabrieldpv@gmail.com
VITE_ADMIN_ENABLED=true
```

### 9.2. Middleware de Proteção
```typescript
// Verificar em cada requisição admin
const isAdmin = (email: string) => {
  return email === import.meta.env.VITE_ADMIN_EMAIL;
};
```

## 10. Próximos Passos

1. ✅ Criar documento de planejamento
2. ⏳ Criar tabelas e views no Supabase via MCP
3. ⏳ Implementar autenticação admin
4. ⏳ Criar página de login
5. ⏳ Criar dashboard com métricas
6. ⏳ Adicionar gráficos
7. ⏳ Implementar tabelas de dados
8. ⏳ Testar segurança
9. ⏳ Deploy e validação

## 11. Considerações de Performance

- Usar views materializadas para queries pesadas
- Implementar cache de 5 minutos para métricas
- Paginação em todas as tabelas
- Lazy loading de gráficos
- Debounce em filtros de busca

## 12. Monitoramento

- Log de acessos ao painel admin
- Alertas de tentativas de acesso não autorizado
- Métricas de performance do painel
- Backup automático de dados críticos
