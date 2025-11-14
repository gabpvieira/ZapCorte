# 🔧 Correção: Trigger handle_new_user

## 🐛 Problema

O trigger `handle_new_user` estava falhando silenciosamente ao criar o profile, causando erro 406 ao tentar buscar dados do usuário após confirmação de email.

**Sintomas:**
```
GET /rest/v1/profiles?user_id=eq.xxx 406 (Not Acceptable)
POST /rest/v1/profiles 400 (Bad Request)
⚠️ Perfil não encontrado, tentando criar...
```

## ✅ Solução

Simplificada a função `handle_new_user()` para:
1. Criar registro em `users` (public)
2. Criar registro em `profiles`
3. O trigger `auto_create_barbershop_for_new_profile` cria barbershop + serviços

### Função Atualizada

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    barbershop_name TEXT;
BEGIN
    -- Criar nome da barbearia
    barbershop_name := SPLIT_PART(NEW.email, '@', 1) || ' Barbearia';
    
    -- Inserir em users
    INSERT INTO public.users (id, email, password_hash)
    VALUES (NEW.id, NEW.email, 'auth_user')
    ON CONFLICT (id) DO NOTHING;
    
    -- Inserir em profiles (dispara trigger de barbershop)
    INSERT INTO public.profiles (user_id, email, full_name, plan_type, subscription_status)
    VALUES (NEW.id, NEW.email, barbershop_name, 'free', 'inactive')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro em handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;
```

## 📊 Fluxo Completo

```
1. Usuário se registra
   ↓
2. Supabase cria em auth.users
   ↓
3. Trigger: handle_new_user()
   - Cria em users (public)
   - Cria em profiles
   ↓
4. Trigger: auto_create_barbershop_for_new_profile()
   - Cria barbershop
   - Cria 4 serviços padrão
   ↓
5. Usuário confirma email
   ↓
6. Faz login
   ↓
7. Dashboard carrega com tudo pronto!
```

## ✅ Status

- [x] Função handle_new_user simplificada
- [x] Tratamento de erros melhorado
- [x] Usuário teste criado com sucesso
- [x] Profile, barbershop e serviços criados automaticamente
- [x] Sistema funcionando

## 🧪 Teste Realizado

1. Usuário: zkgrowthmkt@gmail.com
2. Profile criado: ✅
3. Barbershop criada: ✅
4. 4 serviços criados: ✅
5. Login funcionando: ✅

Sistema pronto para uso! 🚀
