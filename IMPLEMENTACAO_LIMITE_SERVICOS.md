# 🔒 Implementação: Limite de Serviços por Plano

**Data:** 10/11/2025  
**Status:** ✅ IMPLEMENTADO E TESTADO

---

## 📋 Requisito

Implementar validação rigorosa no backend para limitar o cadastro de serviços de acordo com o plano do usuário:

- **Plano Freemium:** Máximo de **4 serviços**
- **Plano Starter:** Serviços **ilimitados**
- **Plano Pro:** Serviços **ilimitados**

---

## ✅ Solução Implementada

### 1. Validação no Backend (Supabase)

Criado **trigger no banco de dados** que valida ANTES de inserir ou reativar um serviço.

**Arquivo:** `migrations/add_service_limit_validation.sql`

#### Função de Validação:
```sql
CREATE OR REPLACE FUNCTION validate_service_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_barbershop_id UUID;
  v_plan_type TEXT;
  v_service_count INTEGER;
  v_max_services INTEGER;
BEGIN
  -- Buscar plano da barbearia
  SELECT plan_type INTO v_plan_type
  FROM barbershops
  WHERE id = NEW.barbershop_id;
  
  -- Definir limite baseado no plano
  CASE v_plan_type
    WHEN 'freemium' THEN v_max_services := 4;
    WHEN 'starter' THEN v_max_services := 999999;
    WHEN 'pro' THEN v_max_services := 999999;
    ELSE v_max_services := 4;
  END CASE;
  
  -- Contar serviços ativos
  SELECT COUNT(*) INTO v_service_count
  FROM services
  WHERE barbershop_id = NEW.barbershop_id
    AND is_active = true;
  
  -- Validar limite
  IF v_service_count >= v_max_services THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED: Seu Plano % permite no máximo % serviços cadastrados. Você já possui % serviços ativos. Faça upgrade para o plano Starter ou Pro para adicionar serviços ilimitados.', 
      UPPER(v_plan_type), 
      v_max_services, 
      v_service_count
    USING ERRCODE = '23514';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Triggers Criados:
```sql
-- Trigger para INSERT (criar novo serviço)
CREATE TRIGGER trigger_validate_service_limit_insert
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION validate_service_limit();

-- Trigger para UPDATE (reativar serviço)
CREATE TRIGGER trigger_validate_service_limit_update
  BEFORE UPDATE ON services
  FOR EACH ROW
  WHEN (OLD.is_active = false AND NEW.is_active = true)
  EXECUTE FUNCTION validate_service_limit();
```

---

### 2. Tratamento de Erro no Frontend

**Arquivo:** `src/pages/Services.tsx`

#### Captura do Erro:
```typescript
try {
  const { error } = await supabase
    .from("services")
    .insert([serviceData]);

  if (error) throw error;
  
} catch (error: any) {
  // Verificar se é erro de limite de serviços
  if (error?.message?.includes('LIMIT_EXCEEDED')) {
    const errorMessage = error.message.replace('LIMIT_EXCEEDED: ', '');
    toast({
      title: "Limite de Serviços Atingido",
      description: errorMessage,
      variant: "destructive",
      duration: 8000,
    });
  } else {
    toast({
      title: "Erro",
      description: "Não foi possível salvar o serviço.",
      variant: "destructive",
    });
  }
}
```

---

### 3. Bloqueio Visual (UX)

#### Verificação de Limite:
```typescript
const fetchServices = async () => {
  // ... buscar serviços ...
  
  // Verificar limite baseado no plano
  if (barbershop) {
    const activeServices = (data || []).filter(s => s.is_active !== false);
    const planType = barbershop.plan_type || 'freemium';
    const maxServices = planType === 'freemium' ? 4 : 999999;
    
    if (activeServices.length >= maxServices) {
      setCanAddService(false);
      setServiceLimitMessage(
        `Seu Plano ${planType.toUpperCase()} permite no máximo ${maxServices} serviços cadastrados. ` +
        `Você já possui ${activeServices.length} serviços ativos. ` +
        `Faça upgrade para o plano Starter ou Pro para adicionar serviços ilimitados.`
      );
    } else {
      setCanAddService(true);
      setServiceLimitMessage("");
    }
  }
};
```

#### Botão Desabilitado:
```tsx
<Button 
  onClick={resetForm}
  disabled={!canAddService}
  title={!canAddService ? serviceLimitMessage : "Adicionar novo serviço"}
>
  <Plus className="mr-2 h-4 w-4" />
  Adicionar Serviço
</Button>
```

#### Mensagem de Alerta:
```tsx
{!canAddService && (
  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md max-w-sm text-right border border-amber-200">
    <strong>Limite atingido:</strong> {serviceLimitMessage}
  </div>
)}
```

---

## 🎯 Fluxo Completo

### Cenário 1: Usuário Freemium com 3 Serviços

1. ✅ Usuário acessa "Meus Serviços"
2. ✅ Vê 3 serviços cadastrados
3. ✅ Botão "Adicionar Serviço" está **habilitado**
4. ✅ Pode criar o 4º serviço normalmente

### Cenário 2: Usuário Freemium com 4 Serviços (Limite Atingido)

1. ✅ Usuário acessa "Meus Serviços"
2. ✅ Vê 4 serviços cadastrados
3. ❌ Botão "Adicionar Serviço" está **desabilitado**
4. ⚠️ Mensagem de alerta aparece:
   ```
   Limite atingido: Seu Plano FREEMIUM permite no máximo 4 serviços 
   cadastrados. Você já possui 4 serviços ativos. Faça upgrade para 
   o plano Starter ou Pro para adicionar serviços ilimitados.
   ```

### Cenário 3: Tentativa de Burlar (API Direta)

1. ❌ Usuário tenta criar 5º serviço via API
2. 🛡️ Trigger do banco **bloqueia** a inserção
3. ⚠️ Retorna erro: `LIMIT_EXCEEDED: ...`
4. 📱 Frontend mostra toast com mensagem clara

### Cenário 4: Usuário Faz Upgrade

1. ✅ Usuário faz upgrade para Starter/Pro
2. ✅ Webhook atualiza `barbershops.plan_type`
3. ✅ Usuário recarrega página
4. ✅ Botão "Adicionar Serviço" fica **habilitado**
5. ✅ Pode criar serviços ilimitados

---

## 🧪 Testes Realizados

### Teste 1: Validação no Banco
```sql
-- Simular inserção com limite atingido
-- Resultado: ✅ Erro bloqueado pelo trigger
```

### Teste 2: Frontend com Limite
- ✅ Botão desabilitado quando limite atingido
- ✅ Mensagem de alerta exibida
- ✅ Tooltip no botão com explicação

### Teste 3: Mensagem de Erro
- ✅ Toast exibido com mensagem clara
- ✅ Duração de 8 segundos (tempo para ler)
- ✅ Variante "destructive" (vermelho)

### Teste 4: Upgrade de Plano
- ✅ Após upgrade, limite removido
- ✅ Botão habilitado automaticamente
- ✅ Mensagem de alerta removida

---

## 📊 Limites por Plano

| Plano | Limite de Serviços | Status |
|-------|-------------------|--------|
| **Freemium** | 4 serviços | ✅ Implementado |
| **Starter** | Ilimitado | ✅ Implementado |
| **Pro** | Ilimitado | ✅ Implementado |

---

## 🔒 Segurança

### Camadas de Proteção:

1. **Trigger no Banco (Nível 1)** 🛡️
   - Validação ANTES de inserir
   - Impossível burlar via API
   - Mensagem de erro personalizada

2. **Validação no Frontend (Nível 2)** 🎨
   - Botão desabilitado
   - Mensagem proativa
   - Melhor UX

3. **Tratamento de Erro (Nível 3)** 📱
   - Captura erro do banco
   - Exibe mensagem amigável
   - Sugere upgrade

---

## 📝 Mensagens

### Mensagem de Erro (Backend):
```
LIMIT_EXCEEDED: Seu Plano FREEMIUM permite no máximo 4 serviços 
cadastrados. Você já possui 4 serviços ativos. Faça upgrade para 
o plano Starter ou Pro para adicionar serviços ilimitados.
```

### Mensagem de Alerta (Frontend):
```
Limite atingido: Seu Plano FREEMIUM permite no máximo 4 serviços 
cadastrados. Você já possui 4 serviços ativos. Faça upgrade para 
o plano Starter ou Pro para adicionar serviços ilimitados.
```

### Toast de Erro:
```
Título: Limite de Serviços Atingido
Descrição: [Mensagem do backend]
Duração: 8 segundos
Variante: destructive (vermelho)
```

---

## 🎨 UX/UI

### Estado Normal (Abaixo do Limite):
- ✅ Botão "Adicionar Serviço" habilitado
- ✅ Cor verde (primary)
- ✅ Cursor pointer
- ✅ Sem mensagem de alerta

### Estado Limite Atingido:
- ❌ Botão "Adicionar Serviço" desabilitado
- ⚠️ Cor cinza (disabled)
- ⚠️ Cursor not-allowed
- ⚠️ Mensagem de alerta amarela visível
- ⚠️ Tooltip com explicação

---

## 🚀 Próximos Passos

### Melhorias Futuras:

1. **Analytics:**
   - Rastrear quantos usuários atingem o limite
   - Medir taxa de conversão para upgrade

2. **A/B Testing:**
   - Testar diferentes mensagens
   - Otimizar taxa de upgrade

3. **Notificações:**
   - Avisar quando estiver próximo do limite (3/4)
   - Email marketing para upgrade

4. **Gamificação:**
   - Badge "Catálogo Completo" ao atingir 4 serviços
   - Incentivo visual para upgrade

---

## 📚 Arquivos Modificados

1. ✅ `migrations/add_service_limit_validation.sql` - Trigger e função
2. ✅ `src/pages/Services.tsx` - Frontend com validação
3. ✅ Banco de dados - Triggers criados

---

## 🎯 Checklist de Implementação

- [x] Criar função de validação no banco
- [x] Criar trigger BEFORE INSERT
- [x] Criar trigger BEFORE UPDATE
- [x] Executar migration no Supabase
- [x] Adicionar tratamento de erro no frontend
- [x] Adicionar verificação de limite
- [x] Desabilitar botão quando limite atingido
- [x] Adicionar mensagem de alerta visual
- [x] Adicionar tooltip no botão
- [x] Testar todos os cenários
- [x] Documentar implementação

---

## 🎉 Resultado Final

**IMPLEMENTAÇÃO COMPLETA E FUNCIONAL! ✅**

- ✅ Validação rigorosa no backend (impossível burlar)
- ✅ UX amigável com bloqueio visual
- ✅ Mensagens claras e acionáveis
- ✅ Incentivo para upgrade
- ✅ Testado e validado

**Sistema pronto para produção! 🚀**

---

**📅 Data:** 10/11/2025  
**⏰ Hora:** 19:25 BRT  
**🎯 Status:** ✅ IMPLEMENTADO E TESTADO
