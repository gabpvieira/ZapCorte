# 🗑️ Scripts de Manutenção do Banco de Dados

## delete-user-by-email.sql

Script para deletar completamente um usuário do sistema por email.

### 📋 O que o script deleta:

1. **Appointments** - Todos os agendamentos das barbershops do usuário
2. **Customers** - Todos os clientes das barbershops do usuário
3. **Services** - Todos os serviços das barbershops do usuário
4. **Availability** - Todos os horários disponíveis das barbershops
5. **Barbershops** - Todas as barbearias do usuário
6. **Payment History** - Histórico de pagamentos do usuário
7. **Profiles** - Perfil do usuário
8. **Users (public)** - Registro na tabela pública
9. **Auth Users** - Registro de autenticação

### 🚀 Como usar:

#### Opção 1: Via Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione o projeto "Zap Corte"
3. Vá em **SQL Editor**
4. Abra o arquivo `delete-user-by-email.sql`
5. **Altere a linha 7:**
   ```sql
   target_email TEXT := 'email@exemplo.com'; -- ALTERE AQUI
   ```
   Para:
   ```sql
   target_email TEXT := 'usuario@deletar.com'; -- Email do usuário
   ```
6. Clique em **Run**

#### Opção 2: Via MCP Supabase (Kiro)

```typescript
mcp_supabase_mcp_lite_execute_query({
  project_ref: "ihwkbflhxvdsewifofdk",
  query: `
    DO $$
    DECLARE
      target_email TEXT := 'usuario@deletar.com'; -- Email aqui
      -- ... resto do script
    END $$;
  `
})
```

### ⚠️ Avisos Importantes

1. **Ação Irreversível** - Não há como desfazer após executar
2. **Backup Recomendado** - Faça backup antes de deletar usuários importantes
3. **Teste Primeiro** - Teste com usuários de teste antes de usar em produção
4. **Verifique o Email** - Confirme o email antes de executar

### 📊 Exemplo de Saída

```
NOTICE:  Deletando usuário: teste@exemplo.com (ID: abc-123-def)
NOTICE:  ✓ Appointments deletados
NOTICE:  ✓ Customers deletados
NOTICE:  ✓ Services deletados
NOTICE:  ✓ Availability deletados
NOTICE:  ✓ Barbershops deletados
NOTICE:  ✓ Payment history deletado
NOTICE:  ✓ Profile deletado
NOTICE:  ✓ User (public) deletado
NOTICE:  ✓ Auth user deletado
NOTICE:  ========================================
NOTICE:  Usuário teste@exemplo.com completamente removido!
NOTICE:  ========================================
```

### 🔍 Verificar Remoção

Após executar, verifique se o usuário foi removido:

```sql
SELECT 
  'auth.users' as tabela,
  COUNT(*) as registros
FROM auth.users 
WHERE email = 'usuario@deletar.com'

UNION ALL

SELECT 
  'profiles' as tabela,
  COUNT(*) as registros
FROM profiles 
WHERE email = 'usuario@deletar.com';
```

Todos os contadores devem retornar **0**.

### 🛡️ Segurança

- Script usa transação implícita (DO block)
- Se houver erro, nada é deletado
- Verifica se usuário existe antes de deletar
- Deleta em ordem correta (dependências primeiro)

### 📝 Casos de Uso

- **Testes** - Limpar usuários de teste
- **GDPR** - Remover dados de usuários que solicitaram
- **Manutenção** - Limpar contas inativas ou duplicadas
- **Desenvolvimento** - Resetar ambiente de teste

### 🔄 Alternativa: Desativar em vez de Deletar

Se preferir desativar em vez de deletar:

```sql
-- Desativar usuário (mantém dados)
UPDATE profiles 
SET subscription_status = 'cancelled'
WHERE email = 'usuario@desativar.com';

UPDATE barbershops 
SET is_active = false
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email = 'usuario@desativar.com'
);
```

---

**Última atualização:** 2025-11-14
**Versão:** 1.0
**Autor:** ZapCorte Team
