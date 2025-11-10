# Fluxo de Upgrade de Plano - Documentação Técnica

## 📋 Visão Geral

Este documento descreve a implementação do fluxo de upgrade de plano sem atrito para usuários já autenticados no sistema ZapCorte Pro.

## 🎯 Objetivos Alcançados

1. ✅ **Redirecionamento Direto**: Usuários logados são redirecionados diretamente para o checkout sem necessidade de novo login
2. ✅ **Pré-Preenchimento Automático**: Dados do usuário (email, nome, telefone) são automaticamente extraídos e enviados ao checkout
3. ✅ **URL Dinâmica**: Sistema gera URLs de checkout com parâmetros personalizados para cada usuário
4. ✅ **Feedback Visual**: Estado de loading durante o processo de redirecionamento

## 🏗️ Arquitetura da Solução

### 1. Hook Personalizado: `useCaktoCheckout`

**Localização**: `src/hooks/useCaktoCheckout.ts`

#### Funcionalidades Principais:

##### `getUserCheckoutData()`
Busca dados completos do usuário logado no Supabase:
- `userId`: ID único do usuário
- `email`: Email do usuário
- `firstName`: Primeiro nome (do perfil)
- `lastName`: Sobrenome (do perfil)
- `phone`: Telefone (do perfil)

```typescript
const userData = await getUserCheckoutData();
// Retorna: { userId, email, firstName, lastName, phone }
```

##### `getCheckoutUrl(planType, userData)`
Gera URL de checkout com parâmetros pré-preenchidos:

```typescript
const url = await getCheckoutUrl('starter', userData);
// Retorna: https://pay.cakto.com.br/3th8tvh?email=user@example.com&user_id=123&...
```

**Parâmetros enviados na URL:**
- `email`: Email do usuário
- `user_id`: ID do usuário no sistema
- `plan`: Tipo do plano (starter/pro)
- `first_name`: Primeiro nome (se disponível)
- `last_name`: Sobrenome (se disponível)
- `phone`: Telefone (se disponível)
- `timestamp`: Timestamp da requisição (para rastreamento)

##### `redirectToCheckout(options)`
Executa o redirecionamento completo com:
- Validação de autenticação
- Loading state
- Busca de dados do usuário
- Geração de URL
- Abertura em nova aba
- Feedback via toast

##### `handleUpgrade(planType)`
Handler simplificado para uso direto em componentes:

```typescript
const { handleUpgrade, isLoading } = useCaktoCheckout();

// Uso:
<button onClick={() => handleUpgrade('starter')}>
  Fazer Upgrade
</button>
```

### 2. Componente Reutilizável: `UpgradeButton`

**Localização**: `src/components/UpgradeButton.tsx`

Componente encapsulado que gerencia todo o fluxo de upgrade:

```typescript
<UpgradeButton planType="starter">
  Fazer Upgrade
</UpgradeButton>
```

**Props disponíveis:**
- `planType`: 'starter' | 'pro' (padrão: 'starter')
- `variant`: Variante visual do botão
- `size`: Tamanho do botão
- `showLoadingText`: Mostrar texto durante loading (padrão: true)
- Todas as props padrão de `<button>`

**Características:**
- Loading state automático
- Ícone de spinner durante processamento
- Desabilitação automática durante loading
- Validação de autenticação integrada

### 3. Integração nas Páginas

#### Página de Planos (`src/pages/Plan.tsx`)

**Botão "Fazer Upgrade" (Plano Atual):**
```typescript
<UpgradeButton planType="starter">
  Fazer Upgrade
</UpgradeButton>
```

**Botões "Assinar Agora" (Cards de Planos):**
```typescript
<UpgradeButton 
  className="w-full" 
  variant="outline"
  planType={planKey as 'starter' | 'pro'}
>
  {currentPlan === 'freemium' ? 'Assinar Agora' : 'Mudar de Plano'}
</UpgradeButton>
```

## 🔄 Fluxo de Execução

```
1. Usuário clica em "Fazer Upgrade" ou "Assinar Agora"
   ↓
2. UpgradeButton chama handleUpgrade(planType)
   ↓
3. Hook verifica se usuário está autenticado
   ↓
4. Se não autenticado → Redireciona para /login
   ↓
5. Se autenticado → Ativa loading state
   ↓
6. Busca dados completos do usuário no Supabase
   ↓
7. Gera URL de checkout com parâmetros pré-preenchidos
   ↓
8. Abre checkout em nova aba
   ↓
9. Exibe toast de confirmação
   ↓
10. Desativa loading state
```

## 🔐 Segurança e Validação

### Validação de Autenticação
```typescript
if (!user) {
  toast({
    title: "Login necessário",
    description: "Você precisa estar logado para fazer upgrade do plano.",
    variant: "destructive",
  });
  window.location.href = '/login';
  return;
}
```

### Tratamento de Erros
```typescript
try {
  // Processo de checkout
} catch (error) {
  console.error('❌ Erro ao redirecionar para checkout:', error);
  toast({
    title: "Erro no checkout",
    description: "Não foi possível abrir a página de pagamento. Tente novamente.",
    variant: "destructive",
  });
} finally {
  setIsLoading(false);
}
```

## 🎨 UX/UI - Estados Visuais

### Estado Normal
```typescript
<Button>Fazer Upgrade</Button>
```

### Estado Loading
```typescript
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Carregando...
</Button>
```

### Feedback Toast
- **Sucesso**: "Redirecionando para pagamento - Abrindo checkout do plano Starter..."
- **Erro**: "Erro no checkout - Não foi possível abrir a página de pagamento. Tente novamente."
- **Não autenticado**: "Login necessário - Você precisa estar logado para fazer upgrade do plano."

## 🔧 Configuração

### Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```env
# URLs de Checkout Cakto
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/3th8tvh
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/9jk3ref
```

### Estrutura do Banco de Dados

O sistema espera a seguinte estrutura na tabela `profiles`:

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  plan_type TEXT DEFAULT 'freemium',
  subscription_status TEXT DEFAULT 'inactive',
  -- outros campos...
);
```

## 📊 Rastreamento e Analytics

Todos os redirecionamentos incluem parâmetros para rastreamento:

- `user_id`: Identificação única do usuário
- `plan`: Plano selecionado
- `timestamp`: Momento do clique
- `email`: Email para correlação

Estes dados podem ser usados para:
- Análise de conversão
- Identificação de abandono de carrinho
- Correlação entre usuário e pagamento
- Auditoria de transações

## 🧪 Testes Recomendados

### Cenários de Teste

1. **Usuário Logado - Plano Freemium**
   - ✅ Clicar em "Fazer Upgrade"
   - ✅ Verificar loading state
   - ✅ Confirmar abertura de nova aba
   - ✅ Validar parâmetros na URL

2. **Usuário Não Logado**
   - ✅ Clicar em "Assinar Agora"
   - ✅ Verificar redirecionamento para /login
   - ✅ Confirmar toast de aviso

3. **Erro de Rede**
   - ✅ Simular falha na busca de dados
   - ✅ Verificar toast de erro
   - ✅ Confirmar que loading state é desativado

4. **Múltiplos Cliques**
   - ✅ Clicar rapidamente várias vezes
   - ✅ Verificar que botão fica desabilitado
   - ✅ Confirmar que apenas uma aba é aberta

## 🚀 Melhorias Futuras

### Possíveis Extensões

1. **Webhook de Confirmação**
   - Receber notificação quando pagamento for confirmado
   - Atualizar automaticamente o plano do usuário

2. **Histórico de Tentativas**
   - Registrar todas as tentativas de upgrade
   - Analytics de abandono de checkout

3. **Cupons de Desconto**
   - Adicionar parâmetro de cupom na URL
   - Validação de cupons antes do redirecionamento

4. **Upgrade Inline**
   - Modal de checkout dentro da aplicação
   - Sem necessidade de abrir nova aba

5. **Downgrade de Plano**
   - Implementar fluxo reverso
   - Confirmação e período de carência

## 📝 Notas de Implementação

### Decisões Técnicas

1. **Nova Aba vs Mesma Aba**
   - Escolhido: Nova aba (`window.open`)
   - Motivo: Preservar estado da aplicação durante checkout

2. **Async/Await vs Promises**
   - Escolhido: Async/Await
   - Motivo: Melhor legibilidade e tratamento de erros

3. **Hook vs Context**
   - Escolhido: Hook customizado
   - Motivo: Menor overhead, uso pontual

4. **Componente vs Hook Direto**
   - Escolhido: Ambos (componente + hook)
   - Motivo: Flexibilidade de uso

## 🐛 Troubleshooting

### Problema: Checkout não abre

**Possíveis causas:**
- Bloqueador de pop-ups ativo
- URLs de checkout não configuradas
- Erro na busca de dados do usuário

**Solução:**
1. Verificar console do navegador
2. Confirmar variáveis de ambiente
3. Testar com bloqueador desativado

### Problema: Dados não pré-preenchidos

**Possíveis causas:**
- Perfil do usuário incompleto
- Gateway de pagamento não suporta parâmetros

**Solução:**
1. Verificar dados na tabela `profiles`
2. Confirmar formato de parâmetros aceitos pelo gateway
3. Testar URL manualmente

## 📚 Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hooks](https://react.dev/reference/react)
- [Cakto Payment Gateway](https://cakto.com.br)

---

**Última atualização**: 2025-11-10
**Versão**: 1.0.0
**Autor**: Sistema ZapCorte Pro
