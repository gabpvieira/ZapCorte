# 🏠 Integração na Landing Page (Home)

## 📋 Contexto

Na landing page (`src/pages/Home.tsx`), os botões de planos atualmente redirecionam para `/register`. Para usuários já logados, podemos melhorar a experiência redirecionando-os diretamente para o checkout.

## 🎯 Estratégia de Implementação

### Opção 1: Detecção Automática (Recomendado)

Detectar se o usuário está logado e ajustar o comportamento do botão automaticamente.

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { useCaktoCheckout } from "@/hooks/useCaktoCheckout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function PlanCard({ plan }) {
  const { user } = useAuth();
  const { handleUpgrade, isLoading } = useCaktoCheckout();

  const handlePlanClick = () => {
    if (plan.name === 'Freemium') {
      // Sempre redireciona para registro
      return;
    }

    if (user) {
      // Usuário logado: vai direto para checkout
      const planType = plan.name.toLowerCase() as 'starter' | 'pro';
      handleUpgrade(planType);
    } else {
      // Usuário não logado: vai para registro
      window.location.href = '/register';
    }
  };

  return (
    <Card>
      <CardContent>
        <h3>{plan.name}</h3>
        <p>R$ {plan.price}/mês</p>
        
        {plan.name === 'Freemium' ? (
          <Button asChild>
            <Link to="/register">{plan.cta}</Link>
          </Button>
        ) : (
          <Button 
            onClick={handlePlanClick}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : plan.cta}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Opção 2: Botão Condicional

Renderizar botões diferentes baseado no estado de autenticação.

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function PlanCard({ plan }) {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <h3>{plan.name}</h3>
        <p>R$ {plan.price}/mês</p>
        
        {plan.name === 'Freemium' ? (
          // Plano gratuito: sempre vai para registro
          <Button asChild>
            <Link to="/register">{plan.cta}</Link>
          </Button>
        ) : user ? (
          // Usuário logado: botão de upgrade direto
          <UpgradeButton 
            planType={plan.name.toLowerCase() as 'starter' | 'pro'}
            className="w-full"
          >
            {plan.cta}
          </UpgradeButton>
        ) : (
          // Usuário não logado: vai para registro
          <Button asChild>
            <Link to="/register">{plan.cta}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Opção 3: Redirecionamento Inteligente

Criar um componente que decide automaticamente o destino.

```tsx
// src/components/SmartPlanButton.tsx
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SmartPlanButtonProps {
  planName: string;
  planType?: 'starter' | 'pro';
  children: React.ReactNode;
  className?: string;
}

export function SmartPlanButton({ 
  planName, 
  planType, 
  children, 
  className 
}: SmartPlanButtonProps) {
  const { user } = useAuth();

  // Plano gratuito sempre vai para registro
  if (planName === 'Freemium') {
    return (
      <Button asChild className={className}>
        <Link to="/register">{children}</Link>
      </Button>
    );
  }

  // Planos pagos: checkout se logado, registro se não
  if (user && planType) {
    return (
      <UpgradeButton 
        planType={planType}
        className={className}
      >
        {children}
      </UpgradeButton>
    );
  }

  return (
    <Button asChild className={className}>
      <Link to="/register">{children}</Link>
    </Button>
  );
}

// Uso na Home:
<SmartPlanButton 
  planName="Starter" 
  planType="starter"
  className="w-full"
>
  Assinar Starter
</SmartPlanButton>
```

## 🎨 Exemplo Completo para Home.tsx

```tsx
// Adicionar no início do arquivo
import { useAuth } from "@/contexts/AuthContext";
import { useCaktoCheckout } from "@/hooks/useCaktoCheckout";

// Dentro do componente Home
const Home = () => {
  const { user } = useAuth();
  const { handleUpgrade, isLoading } = useCaktoCheckout();

  const handlePlanSelection = (planName: string) => {
    if (planName === 'Freemium') {
      window.location.href = '/register';
      return;
    }

    if (user) {
      // Usuário logado: checkout direto
      const planType = planName.toLowerCase() as 'starter' | 'pro';
      handleUpgrade(planType);
    } else {
      // Usuário não logado: registro
      window.location.href = '/register';
    }
  };

  // Na seção de planos, substituir:
  <Button 
    className={`w-full rounded-2xl py-4 sm:py-6 text-base sm:text-lg font-semibold ${
      plan.highlighted
        ? 'bg-[#24C36B] hover:bg-[#1ea557] text-black'
        : 'bg-transparent border-[#24C36B] border-2 text-[#24C36B] hover:bg-[#24C36B] hover:text-black'
    }`}
    onClick={() => handlePlanSelection(plan.name)}
    disabled={isLoading && plan.name !== 'Freemium'}
  >
    {isLoading && plan.name !== 'Freemium' ? 'Carregando...' : plan.cta}
  </Button>
};
```

## 🔄 Fluxo de Decisão

```
Usuário clica em botão de plano
         ↓
    É Freemium?
    ↙        ↘
  Sim         Não
   ↓           ↓
/register  Está logado?
           ↙        ↘
         Sim         Não
          ↓           ↓
      Checkout    /register
```

## 💡 Recomendações

### Para Landing Page Pública

**Use Opção 1 ou 3** - Melhor UX, pois:
- Usuários logados vão direto ao checkout
- Usuários não logados fazem registro primeiro
- Transição suave e automática

### Para Dashboard/Área Logada

**Use UpgradeButton diretamente** - Mais simples, pois:
- Usuário já está autenticado
- Não precisa verificar estado de login
- Código mais limpo

## 🎯 Benefícios da Integração

1. **Redução de Atrito**: Usuários logados não precisam fazer login novamente
2. **Melhor Conversão**: Menos passos = mais conversões
3. **UX Consistente**: Mesmo comportamento em toda aplicação
4. **Rastreamento**: Todos os cliques são rastreados com user_id

## 🧪 Testes Recomendados

### Cenário 1: Usuário Não Logado
1. Acesse a home sem estar logado
2. Clique em "Assinar Starter"
3. ✅ Deve ir para `/register`

### Cenário 2: Usuário Logado - Freemium
1. Faça login com conta Freemium
2. Volte para a home
3. Clique em "Assinar Starter"
4. ✅ Deve abrir checkout diretamente

### Cenário 3: Usuário Logado - Plano Pago
1. Faça login com conta Starter
2. Volte para a home
3. Clique em "Assinar Pro"
4. ✅ Deve abrir checkout do Pro

## 📊 Analytics Sugeridos

Adicione tracking para entender o comportamento:

```tsx
const handlePlanSelection = (planName: string) => {
  // Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'plan_click', {
      plan_name: planName,
      user_logged_in: !!user,
      source: 'landing_page'
    });
  }

  // Lógica de redirecionamento...
};
```

## 🚀 Implementação Rápida

Se você quer implementar agora, use este código:

```tsx
// 1. Adicione os imports no topo de Home.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useCaktoCheckout } from "@/hooks/useCaktoCheckout";

// 2. Dentro do componente Home, adicione:
const { user } = useAuth();
const { handleUpgrade, isLoading } = useCaktoCheckout();

// 3. Substitua os botões de plano por:
{plan.name === 'Freemium' ? (
  <Button asChild>
    <Link to="/register">{plan.cta}</Link>
  </Button>
) : (
  <Button 
    onClick={() => {
      if (user) {
        handleUpgrade(plan.name.toLowerCase() as 'starter' | 'pro');
      } else {
        window.location.href = '/register';
      }
    }}
    disabled={isLoading}
  >
    {isLoading ? 'Carregando...' : plan.cta}
  </Button>
)}
```

---

**Nota**: Esta integração é opcional. O sistema já funciona perfeitamente na página de planos (`/plan`) para usuários logados.
