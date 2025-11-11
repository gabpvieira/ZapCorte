# Correção: Plano não sendo selecionado corretamente após pagamento

## Problema Identificado

Após o pagamento da assinatura, o plano do usuário não estava sendo exibido corretamente na página "Plano & Conta". O sistema mostrava "Freemium" mesmo após o pagamento ser aprovado.

### Causa Raiz

1. **Dessincronia entre tabelas**: O webhook do Cakto atualizava corretamente a tabela `profiles`, mas não estava atualizando a tabela `barbershops`
2. **Lógica de priorização incorreta**: O código priorizava `barbershop.plan_type` sobre `profile.plan_type`, quando deveria ser o contrário

## Correções Implementadas

### 1. Webhook do Cakto (`server/caktoService.js`)

Melhorado o processo de atualização da barbearia:

```javascript
// ANTES: Atualização simples sem verificação
const { data: barbershop, error: barbershopError } = await supabase
  .from('barbershops')
  .update({ plan_type: planType })
  .eq('user_id', user.userId)
  .select();

// DEPOIS: Verificação e logs detalhados
const { data: existingBarbershop, error: checkError } = await supabase
  .from('barbershops')
  .select('id, name, plan_type')
  .eq('user_id', user.userId)
  .maybeSingle();

if (existingBarbershop) {
  console.log('📍 Barbearia encontrada:', {
    id: existingBarbershop.id,
    name: existingBarbershop.name,
    current_plan: existingBarbershop.plan_type,
    new_plan: planType
  });

  const { data: updatedBarbershop, error: updateError } = await supabase
    .from('barbershops')
    .update({ plan_type: planType })
    .eq('user_id', user.userId)
    .select();
}
```

### 2. Lógica de Priorização (`src/pages/Plan.tsx`)

Alterada a ordem de prioridade para usar o `profile.plan_type` como fonte da verdade:

```typescript
// ANTES
const currentPlan = barbershop?.plan_type || profile?.plan_type || 'freemium';

// DEPOIS
const currentPlan = profile?.plan_type || barbershop?.plan_type || 'freemium';
```

**Justificativa**: A tabela `profiles` é atualizada diretamente pelo webhook do Cakto e é a fonte primária de informação sobre assinaturas.

### 3. Script de Correção SQL

Criado script para sincronizar planos existentes:

```sql
-- Atualizar barbershops para ter o mesmo plano do profile
UPDATE barbershops b
SET plan_type = p.plan_type
FROM profiles p
WHERE b.user_id = p.user_id
  AND b.plan_type != p.plan_type
  AND p.subscription_status = 'active';
```

**Executado em**: 11/11/2025
**Registros corrigidos**: 1 (Gabriel Barbeiro - eugabrieldpv@gmail.com)

## Estrutura das Tabelas

### Tabela `profiles`
- **Fonte da verdade** para informações de assinatura
- Campos principais:
  - `plan_type`: 'free', 'starter', 'pro'
  - `subscription_status`: 'active', 'inactive', 'cancelled', 'expired'
  - `last_payment_date`: Data do último pagamento
  - `expires_at`: Data de expiração da assinatura

### Tabela `barbershops`
- Cópia do plano para facilitar queries
- Campo principal:
  - `plan_type`: 'freemium', 'starter', 'pro'

## Fluxo de Pagamento Correto

1. **Cliente realiza pagamento** → Cakto processa
2. **Webhook recebido** → `server/index.js` valida assinatura
3. **Processamento** → `caktoService.js`:
   - Busca usuário por email
   - Atualiza `profiles.plan_type`
   - Atualiza `barbershops.plan_type`
   - Salva histórico em `payment_history`
4. **Frontend atualiza** → `useUserData` hook recarrega dados
5. **Exibição** → Página Plan.tsx mostra plano correto

## Testes Realizados

✅ Verificação de planos desincronizados no banco
✅ Correção de registros existentes via SQL
✅ Melhoria no código do webhook
✅ Ajuste na lógica de priorização do frontend

## Monitoramento

Para verificar se há planos desincronizados:

```sql
SELECT 
  b.id as barbershop_id,
  b.name as barbershop_name,
  b.plan_type as barbershop_plan,
  p.email,
  p.plan_type as profile_plan,
  p.subscription_status
FROM barbershops b
LEFT JOIN profiles p ON b.user_id = p.user_id
WHERE b.plan_type != p.plan_type
  AND p.subscription_status = 'active';
```

## Próximos Passos

- [ ] Monitorar logs do webhook em produção
- [ ] Verificar sincronização após próximos pagamentos
- [ ] Considerar criar trigger no Supabase para manter sincronização automática

## Arquivos Modificados

1. `server/caktoService.js` - Melhorias no processamento do webhook
2. `src/pages/Plan.tsx` - Ajuste na lógica de priorização
3. `server/fix-plan-sync.sql` - Script de correção (novo)
4. `CORRECAO_PLANO_ASSINATURA.md` - Documentação (novo)
