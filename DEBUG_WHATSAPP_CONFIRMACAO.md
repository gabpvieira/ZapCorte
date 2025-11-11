# 🐛 Debug: WhatsApp Confirmação de Agendamento

## ❌ Erro Identificado

```
Failed to load resource: the server responded with a status of 400 ()
[WhatsApp] Erro ao buscar barbearia: Object
```

## 🔍 Causa do Problema

A query do Supabase estava tentando fazer um join incorreto:
```typescript
// ❌ ANTES (ERRADO)
.select(`
  whatsapp_session_id, 
  whatsapp_connected, 
  name,
  users!inner(name)  // ← Erro aqui
`)
```

O relacionamento `users!inner(name)` não funciona porque:
1. A tabela `barbershops` tem `user_id` como foreign key
2. Mas não há um relacionamento direto configurado no Supabase
3. O `!inner` força um join que falha

## ✅ Solução Aplicada

### 1. Corrigir Query da Barbearia
```typescript
// ✅ DEPOIS (CORRETO)
const { data: barbershop, error: barbershopError } = await supabase
  .from('barbershops')
  .select('whatsapp_session_id, whatsapp_connected, name, user_id')
  .eq('id', barbershopId)
  .single();
```

### 2. Buscar Nome do Barbeiro Separadamente
```typescript
// Buscar nome do barbeiro/usuário
let barbeiroNome = 'Barbeiro';
if (barbershop.user_id) {
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', barbershop.user_id)
    .single();
  
  if (user?.name) {
    barbeiroNome = user.name;
  }
}
```

### 3. Adicionar Logs Detalhados

**Em `notifications.ts`:**
```typescript
console.log('[WhatsApp] Preparando envio:', {
  sessionId: barbershop.whatsapp_session_id,
  customerPhone,
  customerName,
  tipo,
  mensagemLength: mensagem.length
});
```

**Em `Appointments.tsx`:**
```typescript
console.log('[Aceitar] Iniciando confirmação:', {
  appointmentId: appointment.id,
  customerName: appointment.customer_name,
  customerPhone: appointment.customer_phone,
  barbershopId: barbershop.id,
  serviceName: appointment.service?.name
});
```

## 🧪 Como Testar Novamente

### 1. Verificar Estrutura do Banco
```sql
-- Verificar se user_id existe na tabela barbershops
SELECT id, name, user_id, whatsapp_session_id, whatsapp_connected 
FROM barbershops 
WHERE user_id = (SELECT id FROM users WHERE email = 'eugabrieldpv@gmail.com');
```

### 2. Verificar WhatsApp Conectado
```sql
-- Verificar status do WhatsApp
SELECT 
  b.id,
  b.name,
  b.whatsapp_connected,
  b.whatsapp_session_id,
  u.name as barbeiro_nome,
  u.email
FROM barbershops b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.email = 'eugabrieldpv@gmail.com';
```

### 3. Testar Confirmação de Agendamento

1. **Abrir Console do Navegador** (F12)
2. **Ir para "Meus Agendamentos"**
3. **Clicar no botão verde (✓) de aceitar**
4. **Verificar logs no console:**

```
[Aceitar] Iniciando confirmação: { ... }
[Aceitar] Status atualizado com sucesso, enviando WhatsApp...
[WhatsApp] Preparando envio: { ... }
[WhatsApp] ✅ Mensagem de confirmacao enviada para [Nome] ([Telefone])
[Aceitar] Resultado do envio WhatsApp: true
```

### 4. Verificar Mensagem no WhatsApp

O cliente deve receber:
```
🎉 *Agendamento Confirmado!*

Olá *[Nome]*! 

Seu agendamento foi confirmado com sucesso:

📅 *Data:* [Dia], [dd/MM/yyyy]
🕐 *Horário:* [HH:mm]
✂️ *Serviço:* [Nome do Serviço]
👨‍💼 *Profissional:* [Nome do Barbeiro]
🏪 *Local:* [Nome da Barbearia]

Estamos ansiosos para atendê-lo!

_Mensagem enviada automaticamente pelo ZapCorte_
```

## 🔧 Checklist de Verificação

- [ ] WhatsApp está conectado? (`whatsapp_connected = true`)
- [ ] Session ID existe? (`whatsapp_session_id` não é null)
- [ ] Telefone do cliente está correto? (formato: 5511999999999)
- [ ] Evolution API está rodando?
- [ ] API Key está correta?
- [ ] Logs aparecem no console?

## 📊 Possíveis Erros e Soluções

### Erro 1: "WhatsApp não conectado"
**Solução:** Ir em WhatsApp Settings e conectar o WhatsApp

### Erro 2: "Erro ao buscar barbearia"
**Solução:** ✅ Já corrigido - query do Supabase estava errada

### Erro 3: "Falha ao enviar mensagem"
**Possíveis causas:**
- Evolution API offline
- Session ID inválido
- Telefone em formato incorreto
- WhatsApp desconectado

**Solução:** Verificar logs detalhados no console

### Erro 4: Mensagem não chega
**Verificar:**
1. Telefone está no formato correto? (55 + DDD + número)
2. WhatsApp do cliente está ativo?
3. Número não está bloqueado?

## 🚀 Próximos Passos

Após aplicar as correções:

1. **Limpar cache do navegador** (Ctrl + Shift + Delete)
2. **Recarregar página** (Ctrl + F5)
3. **Abrir console** (F12)
4. **Testar confirmação** de agendamento
5. **Verificar logs** detalhados
6. **Confirmar recebimento** da mensagem WhatsApp

## 📝 Logs Esperados (Sucesso)

```
[Aceitar] Iniciando confirmação: {
  appointmentId: "abc123",
  customerName: "João Silva",
  customerPhone: "11999999999",
  barbershopId: "xyz789",
  serviceName: "Corte + Barba"
}

[Aceitar] Status atualizado com sucesso, enviando WhatsApp...

[WhatsApp] Preparando envio: {
  sessionId: "barbershop-xyz789",
  customerPhone: "11999999999",
  customerName: "João Silva",
  tipo: "confirmacao",
  mensagemLength: 345
}

[WhatsApp] ✅ Mensagem de confirmacao enviada para João Silva (11999999999)

[Aceitar] Resultado do envio WhatsApp: true
```

---

**Data:** 11/11/2025  
**Status:** ✅ Corrigido  
**Usuário de Teste:** eugabrieldpv@gmail.com
