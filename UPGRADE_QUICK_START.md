# 🚀 Guia Rápido - Sistema de Upgrade de Plano

## ✨ O que foi implementado?

Um sistema completo de upgrade de plano que permite aos usuários já logados (Plano Freemium) fazer upgrade para planos pagos (Starter ou Pro) **sem precisar fazer login novamente** ou preencher dados manualmente.

## 🎯 Principais Benefícios

- ✅ **Zero Atrito**: Usuário logado vai direto para o checkout
- ✅ **Dados Pré-preenchidos**: Email, nome e telefone já vêm preenchidos
- ✅ **Feedback Visual**: Loading spinner durante o processo
- ✅ **Seguro**: Validação automática de autenticação

## 📦 Componentes Criados

### 1. Hook: `useCaktoCheckout`
**Arquivo**: `src/hooks/useCaktoCheckout.ts`

Hook que gerencia toda a lógica de checkout.

### 2. Componente: `UpgradeButton`
**Arquivo**: `src/components/UpgradeButton.tsx`

Botão reutilizável para upgrade de plano.

### 3. Documentação Completa
**Arquivo**: `UPGRADE_CHECKOUT_FLOW.md`

Documentação técnica detalhada da implementação.

## 🔧 Como Usar

### Uso Básico

```tsx
import { UpgradeButton } from "@/components/UpgradeButton";

// Botão simples para upgrade ao Starter
<UpgradeButton planType="starter">
  Fazer Upgrade
</UpgradeButton>

// Botão para upgrade ao Pro
<UpgradeButton planType="pro">
  Assinar Plano Pro
</UpgradeButton>
```

### Uso Avançado

```tsx
// Com variantes e tamanhos customizados
<UpgradeButton 
  planType="starter"
  variant="outline"
  size="lg"
  className="w-full"
>
  Assinar Agora
</UpgradeButton>

// Sem texto de loading
<UpgradeButton 
  planType="pro"
  showLoadingText={false}
>
  Upgrade Pro
</UpgradeButton>
```

### Uso do Hook Diretamente

```tsx
import { useCaktoCheckout } from "@/hooks/useCaktoCheckout";

function MeuComponente() {
  const { handleUpgrade, isLoading } = useCaktoCheckout();

  return (
    <button 
      onClick={() => handleUpgrade('starter')}
      disabled={isLoading}
    >
      {isLoading ? 'Carregando...' : 'Fazer Upgrade'}
    </button>
  );
}
```

## 📍 Onde foi Implementado

### ✅ Página de Planos (`src/pages/Plan.tsx`)

1. **Botão "Fazer Upgrade"** no card do plano atual
2. **Botões "Assinar Agora"** nos cards de comparação de planos

### ✅ Dashboard (`src/pages/Dashboard.tsx`)

O botão "Fazer Upgrade" já existente agora redireciona para a página de planos onde o novo sistema está ativo.

## 🔐 Configuração Necessária

### 1. Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```env
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/3th8tvh
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/9jk3ref
```

### 2. Estrutura do Banco de Dados

Certifique-se de que a tabela `profiles` tem os campos:

```sql
- user_id (UUID)
- email (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- plan_type (TEXT)
```

## 🎬 Fluxo do Usuário

```
1. Usuário está logado no Plano Freemium
   ↓
2. Clica em "Fazer Upgrade" ou "Assinar Agora"
   ↓
3. Botão mostra loading (spinner + "Carregando...")
   ↓
4. Sistema busca dados do usuário automaticamente
   ↓
5. Gera URL de checkout com dados pré-preenchidos
   ↓
6. Abre checkout em nova aba
   ↓
7. Toast de confirmação aparece
   ↓
8. Usuário completa pagamento no gateway
```

## 🧪 Como Testar

### Teste 1: Usuário Logado
1. Faça login com uma conta Freemium
2. Vá para "Plano & Conta"
3. Clique em "Fazer Upgrade"
4. Verifique se:
   - Botão mostra loading
   - Nova aba abre com checkout
   - URL contém seus dados (email, user_id, etc.)
   - Toast de confirmação aparece

### Teste 2: Usuário Não Logado
1. Faça logout
2. Tente acessar a página de planos
3. Clique em "Assinar Agora"
4. Verifique se é redirecionado para login

### Teste 3: Múltiplos Cliques
1. Estando logado, clique rapidamente várias vezes em "Fazer Upgrade"
2. Verifique se:
   - Botão fica desabilitado após primeiro clique
   - Apenas uma aba é aberta
   - Loading state funciona corretamente

## 🐛 Problemas Comuns

### Checkout não abre
**Solução**: Desative bloqueador de pop-ups do navegador

### Dados não aparecem pré-preenchidos
**Solução**: Verifique se o perfil do usuário está completo no banco de dados

### Erro "Login necessário"
**Solução**: Faça login novamente, pode ser que a sessão tenha expirado

## 📊 Parâmetros Enviados ao Checkout

Quando o usuário clica em upgrade, a URL gerada contém:

- `email`: Email do usuário
- `user_id`: ID único no sistema
- `plan`: Plano selecionado (starter/pro)
- `first_name`: Primeiro nome
- `last_name`: Sobrenome
- `phone`: Telefone
- `timestamp`: Momento do clique

**Exemplo de URL gerada:**
```
https://pay.cakto.com.br/3th8tvh?email=joao@example.com&user_id=abc123&plan=starter&first_name=João&last_name=Silva&phone=11999999999&timestamp=2025-11-10T10:30:00.000Z
```

## 🎨 Customização

### Alterar Texto do Botão

```tsx
<UpgradeButton planType="starter">
  Seu Texto Aqui
</UpgradeButton>
```

### Alterar Estilo

```tsx
<UpgradeButton 
  planType="starter"
  variant="destructive"  // default, outline, destructive, secondary, ghost, link
  size="sm"              // default, sm, lg, icon
  className="minha-classe-custom"
>
  Upgrade
</UpgradeButton>
```

### Desabilitar Temporariamente

```tsx
<UpgradeButton 
  planType="starter"
  disabled={minhaCondicao}
>
  Upgrade
</UpgradeButton>
```

## 📚 Documentação Adicional

Para detalhes técnicos completos, consulte:
- **Documentação Técnica**: `UPGRADE_CHECKOUT_FLOW.md`
- **Código do Hook**: `src/hooks/useCaktoCheckout.ts`
- **Código do Componente**: `src/components/UpgradeButton.tsx`

## 🚀 Próximos Passos

1. **Testar em produção** com usuários reais
2. **Configurar webhook** para atualizar plano após pagamento confirmado
3. **Adicionar analytics** para rastrear conversões
4. **Implementar cupons de desconto** (se necessário)

## 💡 Dicas

- O sistema funciona apenas para usuários **logados**
- Usuários não logados são redirecionados para `/login`
- O checkout abre em **nova aba** para não perder o estado da aplicação
- Todos os erros são tratados com **toasts informativos**

---

**Dúvidas?** Consulte a documentação técnica completa em `UPGRADE_CHECKOUT_FLOW.md`
