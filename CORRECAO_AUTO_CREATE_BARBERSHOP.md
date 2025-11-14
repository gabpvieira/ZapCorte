# 🔧 Correção: Auto-criar Barbershop após Registro

## 🐛 Problema

Após o usuário se cadastrar e confirmar o email, o sistema não criava automaticamente a barbearia (barbershop), causando erro 406 ao tentar buscar dados.

**Logs do erro:**
```
GET /rest/v1/barbershops?...&is_active=eq.true 406 (Not Acceptable)
✅ Barbershop: Não encontrada
```

## ✅ Solução Implementada

### 1. Função SQL Criada

Criada função `auto_create_barbershop_for_new_profile()` que:
- É executada automaticamente após inserir um profile
- Gera slug único baseado no nome do usuário
- Cria barbershop com configurações padrão
- Usa plan_type correto ('freemium' para barbershops)

### 2. Trigger Criado

```sql
CREATE TRIGGER trigger_auto_create_barbershop
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_barbershop_for_new_profile();
```

### 3. Barbershop Criada Manualmente

Para o usuário existente (zkgrowthmkt@gmail.com), criada barbershop manualmente.

## 📊 Diferença de plan_type

**Importante:** Os valores de plan_type são diferentes:

- **profiles:** 'free', 'starter', 'pro'
- **barbershops:** 'freemium', 'starter', 'pro'

## 🧪 Teste

Agora ao registrar um novo usuário:
1. Profile é criado
2. Trigger executa automaticamente
3. Barbershop é criada
4. Usuário pode fazer login e acessar dashboard

## ✅ Status

- [x] Função SQL criada
- [x] Trigger configurado
- [x] Barbershop criada para usuário existente
- [x] Sistema funcionando

Próximos cadastros criarão barbershop automaticamente! 🚀
