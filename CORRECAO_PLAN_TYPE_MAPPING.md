# 🔧 Correção: Mapeamento de plan_type entre profiles e barbershops

## 🐛 Problema

O trigger `auto_create_barbershop_for_new_profile()` estava falhando porque:
- **profiles** usa: 'free', 'starter', 'pro'
- **barbershops** usa: 'freemium', 'starter', 'pro'

Quando criava profile com plan_type='free', tentava criar barbershop com 'free', violando constraint.

## ✅ Solução

Adicionado mapeamento na função SQL:

```sql
-- Mapear plan_type de profiles para barbershops
barbershop_plan := CASE 
  WHEN NEW.plan_type = 'free' THEN 'freemium'
  ELSE COALESCE(NEW.plan_type, 'freemium')
END;
```

## 📊 Mapeamento

| profiles | barbershops |
|----------|-------------|
| free     | freemium    |
| starter  | starter     |
| pro      | pro         |

## ✅ Status

- [x] Função SQL corrigida
- [x] Mapeamento implementado
- [x] Usuário teste criado com sucesso
- [x] Barbershop + 4 serviços criados automaticamente

Sistema funcionando corretamente! 🚀
