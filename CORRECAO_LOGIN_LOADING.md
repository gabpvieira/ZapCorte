# Correção: Erro no Login - Loading Infinito

## Problema Identificado

O sistema apresentava erro ao fazer login, ficando travado na tela de "Carregando dados..." sem conseguir acessar o dashboard.

### Sintomas
- Erro no console: "Error fetching user data: {}"
- Erro no console: "Erro ao buscar dados do usuário: {}"
- Tela fica travada em "Carregando dados..."
- Não consegue acessar o dashboard após login bem-sucedido

### Causa Raiz

O problema estava no hook `useUserData.ts`:

1. **Perfil não criado automaticamente**: Quando um usuário fazia login, o perfil não era criado na tabela `profiles` de forma confiável
2. **Tratamento de erro inadequado**: A função `getUserProfile` retornava `null` sem tentar criar o perfil
3. **Timeout muito curto**: O timeout de 7-8 segundos era insuficiente para conexões lentas
4. **Falta de retry**: Não havia tentativa de criar o perfil se ele não existisse

## Correções Aplicadas

### 1. Melhorias no `useUserData.ts`

#### Criação automática de perfil
```typescript
// Se o perfil não existir, tentar criar
if (!userProfile) {
  console.log('⚠️ Perfil não encontrado, tentando criar...');
  try {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        plan_type: 'freemium',
        subscription_status: 'inactive'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
      throw new Error('Não foi possível criar o perfil do usuário');
    }

    userProfile = newProfile;
    console.log('✅ Perfil criado com sucesso:', userProfile);
  } catch (createErr) {
    // Tentar buscar novamente (pode ter sido criado por outro processo)
    userProfile = await withTimeout(getUserProfile(user.id));
    if (!userProfile) {
      throw new Error('Perfil não encontrado e não foi possível criar');
    }
  }
}
```

#### Timeout aumentado
- Timeout de busca: 7s → **10s**
- Timeout de fallback: 8s → **12s**

#### Mensagens de erro mais descritivas
```typescript
const errorMessage = isTimeout 
  ? 'Tempo esgotado ao carregar dados do usuário' 
  : (err as Error).message || 'Erro ao carregar dados do usuário';
setError(errorMessage);
```

### 2. Melhorias no `supabase-queries.ts`

#### Logging detalhado de erros
```typescript
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    // Se o erro for PGRST116, significa que não encontrou nenhum registro
    if (error.code === 'PGRST116') {
      console.log('Perfil não encontrado para o usuário:', userId);
    }
    return null
  }

  return data
}
```

## Como Testar

1. **Limpar dados locais**:
   ```javascript
   // No console do navegador
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Fazer login novamente**:
   - Acesse `/login`
   - Entre com suas credenciais
   - O sistema deve criar o perfil automaticamente se não existir

3. **Verificar logs no console**:
   - Deve aparecer: "✅ Perfil criado com sucesso" (se for novo usuário)
   - Ou: "✅ Profile encontrado" (se o perfil já existir)

4. **Confirmar acesso ao dashboard**:
   - Deve redirecionar para `/dashboard` sem erros
   - Dados devem carregar corretamente

## Possíveis Problemas Adicionais

Se o erro persistir, verifique:

### 1. Políticas RLS do Supabase

Certifique-se de que as políticas RLS da tabela `profiles` permitem:
- **SELECT**: Usuários podem ler seu próprio perfil
- **INSERT**: Usuários podem criar seu próprio perfil
- **UPDATE**: Usuários podem atualizar seu próprio perfil

```sql
-- Política de SELECT
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

### 2. Variáveis de Ambiente

Verifique se as variáveis estão configuradas corretamente:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Conexão com Supabase

Teste a conexão no console do navegador:
```javascript
import { supabase } from '@/lib/supabase';

// Testar autenticação
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão:', session);

// Testar busca de perfil
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single();
console.log('Perfil:', data, 'Erro:', error);
```

## Próximos Passos

1. **Monitorar logs**: Acompanhe os logs do console para identificar outros possíveis problemas
2. **Testar com diferentes usuários**: Verifique se o problema ocorre com usuários novos e existentes
3. **Verificar performance**: Se o loading ainda estiver lento, considere otimizar as queries do Supabase

## Arquivos Modificados

- ✅ `src/hooks/useUserData.ts` - Adicionada criação automática de perfil e melhor tratamento de erros
- ✅ `src/lib/supabase-queries.ts` - Adicionado logging detalhado de erros

## Status

✅ **Correção aplicada e testada**

O sistema agora deve:
- Criar perfis automaticamente quando necessário
- Fornecer mensagens de erro mais claras
- Ter timeouts mais adequados para conexões lentas
- Fazer retry automático em caso de falha temporária
