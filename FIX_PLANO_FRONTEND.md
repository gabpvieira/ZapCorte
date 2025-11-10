# 🔧 Fix: Plano não Aparecendo no Frontend

## 🐛 Problema Identificado

**Sintoma:** Usuário mozeli (carvalhomozeli@gmail.com) fez pagamento e o plano foi atualizado no banco, mas o frontend continuava mostrando "Freemium" em vez de "Starter".

## 🔍 Causa Raiz

O sistema tem **duas tabelas** que armazenam o tipo de plano:

1. **`profiles`** - Tabela de perfis de usuário
2. **`barbershops`** - Tabela de barbearias

O código do webhook estava atualizando apenas a tabela `profiles`, mas o frontend lê o plano da tabela `barbershops` primeiro:

```typescript
// src/pages/Plan.tsx linha 13
const currentPlan = barbershop?.plan_type || profile?.plan_type || 'freemium';
```

**Ordem de prioridade:**
1. `barbershop.plan_type` (era "freemium" ❌)
2. `profile.plan_type` (era "starter" ✅)
3. Fallback: "freemium"

Como `barbershop.plan_type` tinha valor, o sistema usava ele, ignorando o `profile.plan_type`.

---

## ✅ Solução Aplicada

### 1. Atualização Manual do Usuário Mozeli

```sql
-- Atualizado manualmente para corrigir o problema imediato
UPDATE barbershops
SET plan_type = 'starter'
WHERE user_id = '1cf34307-829a-4392-ad13-93b5aaec8124';
```

**Resultado:**
- ✅ Usuário mozeli agora vê "Starter" no frontend
- ✅ Plano correto em ambas as tabelas

### 2. Correção do Código do Webhook

Atualizado `server/caktoService.js` para atualizar **AMBAS** as tabelas:

**Antes (❌ Problemático):**
```javascript
// Atualizava apenas profiles
const { error: updateError } = await supabase
  .from('profiles')
  .update(updateData)
  .eq(profileIdField, profileIdValue);
```

**Depois (✅ Corrigido):**
```javascript
// Atualiza profiles
const { error: updateError } = await supabase
  .from('profiles')
  .update(updateData)
  .eq(profileIdField, profileIdValue);

// Atualiza TAMBÉM barbershops
const { error: barbershopError } = await supabase
  .from('barbershops')
  .update({ 
    plan_type: planType
  })
  .eq('user_id', profileIdValue);
```

### 3. Aplicado em Todas as Funções

A correção foi aplicada em:
- ✅ `processPaymentApproved()` - Atualiza para starter/pro
- ✅ `processRefund()` - Volta para freemium
- ✅ `processSubscriptionCancelled()` - Volta para freemium

---

## 📊 Verificação

### Antes da Correção:
```sql
-- profiles
plan_type: 'starter' ✅

-- barbershops
plan_type: 'freemium' ❌

-- Frontend mostrava: Freemium ❌
```

### Depois da Correção:
```sql
-- profiles
plan_type: 'starter' ✅

-- barbershops
plan_type: 'starter' ✅

-- Frontend mostra: Starter ✅
```

---

## 🧪 Teste Realizado

### Teste 1: Verificar Dados no Banco
```sql
-- Perfil
SELECT id, email, plan_type, subscription_status
FROM profiles
WHERE email = 'carvalhomozeli@gmail.com';

-- Resultado:
-- plan_type: 'starter' ✅
-- subscription_status: 'active' ✅

-- Barbearia
SELECT id, name, plan_type
FROM barbershops
WHERE user_id = '1cf34307-829a-4392-ad13-93b5aaec8124';

-- Resultado:
-- plan_type: 'starter' ✅
```

### Teste 2: Verificar Frontend
- ✅ Usuário faz login
- ✅ Acessa página "Plano & Conta"
- ✅ Vê "Starter" como plano atual
- ✅ Vê "R$ 30/mês" como preço
- ✅ Vê data de último pagamento
- ✅ Vê data de expiração

---

## 🚀 Próximos Pagamentos

Com a correção aplicada, todos os próximos pagamentos irão:

1. ✅ Atualizar `profiles.plan_type`
2. ✅ Atualizar `barbershops.plan_type`
3. ✅ Frontend mostrará o plano correto imediatamente

---

## 📝 Observação Importante

### Por que duas tabelas?

O sistema foi projetado para suportar:
- **Usuários** que podem ter múltiplas barbearias
- **Barbearias** que têm seu próprio plano

Atualmente, o sistema usa:
- `profiles.plan_type` - Plano do usuário
- `barbershops.plan_type` - Plano da barbearia

O frontend prioriza o plano da barbearia, pois é mais específico.

### Alternativa Futura

Para simplificar, considere:
1. Usar apenas `barbershops.plan_type`
2. Remover `profiles.plan_type`
3. Atualizar o código para ler apenas de `barbershops`

Ou:
1. Usar apenas `profiles.plan_type`
2. Remover `barbershops.plan_type`
3. Atualizar o código para ler apenas de `profiles`

---

## 🎯 Checklist de Correção

- [x] Identificado o problema (duas tabelas)
- [x] Atualizado manualmente o usuário mozeli
- [x] Corrigido código do webhook (processPaymentApproved)
- [x] Corrigido código do webhook (processRefund)
- [x] Corrigido código do webhook (processSubscriptionCancelled)
- [x] Removido campo `updated_at` (não existe em barbershops)
- [x] Testado e validado
- [x] Documentado

---

## 📚 Arquivos Modificados

1. ✅ `server/caktoService.js` - Adicionada atualização de barbershops
2. ✅ Banco de dados - Atualizado manualmente usuário mozeli

---

## 🎉 Resultado Final

**PROBLEMA RESOLVIDO! ✅**

- ✅ Usuário mozeli vê plano Starter no frontend
- ✅ Próximos pagamentos atualizarão ambas as tabelas
- ✅ Sistema funcionando corretamente

---

**📅 Data da Correção:** 10/11/2025  
**⏰ Hora:** 19:15 BRT  
**🎯 Status:** ✅ CORRIGIDO E TESTADO
