# 🔧 Correção Final: Trigger com RLS

## 🐛 Problema

O trigger `handle_new_user` não estava sendo executado devido a:
1. RLS (Row Level Security) ativado nas tabelas
2. Função sem permissões adequadas para bypassar RLS
3. Falta de logs para debug

## ✅ Solução

1. **Função atualizada com logs detalhados**
2. **SECURITY DEFINER** garantido
3. **Permissões GRANT** adicionadas
4. **SET search_path** configurado

### Alterações

```sql
-- Função com logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
-- ... com RAISE NOTICE para debug
END;
$function$;

-- Garantir permissões
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
ALTER FUNCTION public.auto_create_barbershop_for_new_profile() SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auto_create_barbershop_for_new_profile() TO postgres, authenticated, anon;
```

## 🧪 Como Testar

1. **Deletar usuário anterior:**
```sql
DELETE FROM auth.users WHERE email = 'zkgrowthmkt@gmail.com';
```

2. **Registrar novo usuário:**
   - Use um email diferente (ex: teste@exemplo.com)
   - Complete o cadastro
   - Confirme o email

3. **Verificar criação automática:**
```sql
SELECT 
  u.email,
  p.id as profile_id,
  b.id as barbershop_id,
  COUNT(s.id) as total_servicos
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN barbershops b ON u.id = b.user_id
LEFT JOIN services s ON b.id = s.barbershop_id
WHERE u.email = 'teste@exemplo.com'
GROUP BY u.email, p.id, b.id;
```

Deve retornar:
- profile_id: ✅ (UUID)
- barbershop_id: ✅ (UUID)
- total_servicos: ✅ (4)

## ⚠️ Importante

Se ainda não funcionar, o problema pode ser:
1. **Trigger desabilitado** - Verificar com DBA
2. **Permissões do schema auth** - Pode precisar de superuser
3. **Versão do Supabase** - Algumas versões têm limitações

## 🔄 Alternativa

Se o trigger não funcionar, criar profile via API após confirmação de email no frontend.

---

**Status:** Aguardando teste em produção
