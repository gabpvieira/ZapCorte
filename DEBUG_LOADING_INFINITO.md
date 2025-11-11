# 🔍 Debug: Carregamento Infinito

## Problema Reportado
O app não está mostrando o conteúdo, fica só com carregamento infinito.

## Checklist de Verificação

### 1. Verificar Console do Navegador
Abra o DevTools (F12) e verifique:
- ❓ Há erros no console?
- ❓ Há warnings de loop infinito?
- ❓ Há erros de rede (Network tab)?

### 2. Verificar Logs do useUserData
No console, procure por logs como:
```
🔄 useUserData useEffect: { user: ..., authLoading: ..., localLoading: ... }
🚀 fetchUserData: Iniciando para usuário ...
👤 Profile encontrado: ...
🏪 Barbearia encontrada: ...
✂️ Serviços encontrados: ...
🎉 fetchUserData: Concluído com sucesso
```

### 3. Verificar Estado de Loading
Se o loading não finaliza, pode ser:
- ❓ AuthContext não está finalizando (`authLoading` sempre `true`)
- ❓ useUserData não está finalizando (`loading` sempre `true`)
- ❓ Erro silencioso nas queries do Supabase

### 4. Verificar Conexão com Supabase
```javascript
// No console do navegador, execute:
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, 'Error:', error);
```

### 5. Verificar se o Usuário Está Logado
```javascript
// No console do navegador:
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

## Possíveis Causas

### Causa 1: Timeout nas Queries
O `useUserData` tem timeout de 7 segundos para cada query e 8 segundos total.
Se as queries estão demorando muito, pode estar travando.

**Solução:**
```typescript
// Já implementado no useUserData.ts
const withTimeout = async <T,>(promise: Promise<T>, ms = 7000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]) as Promise<T>;
};
```

### Causa 2: Loop Infinito no useEffect
Verificar se há dependências que mudam constantemente.

**Status:** ✅ Verificado - useEffect está correto com `[barbershop?.id]`

### Causa 3: Erro na Query do Supabase
Se houver erro na query, pode não estar sendo tratado corretamente.

**Solução:** Verificar logs no console

### Causa 4: Perfil ou Barbearia Não Existe
Se o usuário não tem perfil ou barbearia, pode estar travando.

**Solução:** Verificar no Supabase se os dados existem

## Testes Rápidos

### Teste 1: Verificar se Auth Está Funcionando
```bash
# No console do navegador:
localStorage.getItem('supabase.auth.token')
```

### Teste 2: Forçar Finalização do Loading
Adicione temporariamente no `Appointments.tsx`:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('⏱️ Forçando finalização do loading após 5s');
    setLoading(false);
  }, 5000);
  return () => clearTimeout(timer);
}, []);
```

### Teste 3: Verificar Dados no Supabase
```sql
-- No Supabase SQL Editor:
SELECT * FROM profiles WHERE user_id = 'SEU_USER_ID';
SELECT * FROM barbershops WHERE user_id = 'SEU_USER_ID';
```

## Solução Temporária

Se o problema persistir, adicione um fallback no `Appointments.tsx`:

```typescript
// Adicionar após o useEffect existente
useEffect(() => {
  // Fallback: se loading não finalizar em 10 segundos, forçar
  const fallbackTimer = setTimeout(() => {
    if (loading) {
      console.warn('⚠️ Loading não finalizou em 10s, forçando finalização');
      setLoading(false);
    }
  }, 10000);

  return () => clearTimeout(fallbackTimer);
}, [loading]);
```

## Próximos Passos

1. ✅ Abrir DevTools e verificar console
2. ✅ Verificar Network tab para erros de rede
3. ✅ Executar testes rápidos acima
4. ✅ Reportar logs encontrados

## Informações para Debug

Por favor, forneça:
- [ ] Logs do console (copiar e colar)
- [ ] Erros da Network tab
- [ ] Resultado dos testes rápidos
- [ ] Qual página está travando (Dashboard, Appointments, etc.)
