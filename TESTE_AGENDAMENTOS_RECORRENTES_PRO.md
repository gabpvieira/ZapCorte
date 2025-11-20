# 🧪 Guia de Teste: Agendamentos Recorrentes - Plano PRO

## 📋 Pré-requisitos

- ✅ Migration executada no Supabase
- ✅ Código atualizado e em produção
- ✅ Conta com Plano PRO ativa
- ✅ Pelo menos 1 barbeiro cadastrado
- ✅ Pelo menos 1 cliente cadastrado

## 🎯 Testes a Realizar

### Teste 1: Verificar Campo Barbeiro (Plano FREE)

**Objetivo:** Confirmar que campo barbeiro NÃO aparece para planos FREE/Starter

**Passos:**
1. Fazer login com conta FREE ou Starter
2. Navegar para "Meus Agendamentos"
3. Clicar na aba "Recorrentes"
4. Clicar em "Novo Recorrente"

**Resultado Esperado:**
- ❌ Campo "Barbeiro" NÃO deve aparecer no formulário
- ✅ Apenas campos: Cliente, Serviço, Frequência, Dia, Horário

**Status:** [ ] Passou [ ] Falhou

---

### Teste 2: Verificar Campo Barbeiro (Plano PRO)

**Objetivo:** Confirmar que campo barbeiro APARECE para plano PRO

**Passos:**
1. Fazer login com conta PRO
2. Navegar para "Meus Agendamentos"
3. Clicar na aba "Recorrentes"
4. Clicar em "Novo Recorrente"

**Resultado Esperado:**
- ✅ Campo "Barbeiro (Opcional)" DEVE aparecer
- ✅ Dropdown com lista de barbeiros
- ✅ Opção "Atribuição Automática" disponível
- ✅ Texto de ajuda: "Barbeiro fixo para este agendamento recorrente"

**Status:** [ ] Passou [ ] Falhou

---

### Teste 3: Criar Recorrente com Barbeiro Específico

**Objetivo:** Criar agendamento recorrente com barbeiro atribuído

**Passos:**
1. Login com conta PRO
2. Ir em "Meus Agendamentos" → "Recorrentes"
3. Clicar "Novo Recorrente"
4. Preencher:
   - Cliente: Selecionar um cliente existente
   - Serviço: Selecionar um serviço
   - Barbeiro: Selecionar "Carlos" (ou outro barbeiro)
   - Frequência: Semanal
   - Dia: Segunda-feira
   - Horário: 14:00
   - Data de Início: Próxima segunda-feira
5. Clicar "Criar"

**Resultado Esperado:**
- ✅ Toast de sucesso: "Agendamento recorrente criado com sucesso"
- ✅ Recorrente aparece na lista
- ✅ Badge roxo com nome do barbeiro aparece no card
- ✅ Texto: "👨‍💼 Carlos" (ou nome do barbeiro selecionado)

**Status:** [ ] Passou [ ] Falhou

---

### Teste 4: Criar Recorrente com Atribuição Automática

**Objetivo:** Criar agendamento recorrente sem barbeiro específico

**Passos:**
1. Login com conta PRO
2. Ir em "Meus Agendamentos" → "Recorrentes"
3. Clicar "Novo Recorrente"
4. Preencher:
   - Cliente: Selecionar um cliente
   - Serviço: Selecionar um serviço
   - Barbeiro: Deixar em "Atribuição Automática"
   - Frequência: Semanal
   - Dia: Terça-feira
   - Horário: 15:00
   - Data de Início: Próxima terça-feira
5. Clicar "Criar"

**Resultado Esperado:**
- ✅ Toast de sucesso
- ✅ Recorrente aparece na lista
- ❌ Badge de barbeiro NÃO aparece (atribuição automática)

**Status:** [ ] Passou [ ] Falhou

---

### Teste 5: Editar Recorrente e Alterar Barbeiro

**Objetivo:** Alterar barbeiro de um recorrente existente

**Passos:**
1. Na lista de recorrentes, clicar no ícone de editar (✏️)
2. Alterar o barbeiro de "Carlos" para "Pedro"
3. Clicar "Atualizar"

**Resultado Esperado:**
- ✅ Toast de sucesso: "Agendamento recorrente atualizado"
- ✅ Badge atualizado para "Pedro"
- ✅ Próximos agendamentos gerados terão o novo barbeiro

**Status:** [ ] Passou [ ] Falhou

---

### Teste 6: Verificar no Banco de Dados

**Objetivo:** Confirmar que dados foram salvos corretamente

**Passos:**
1. Acessar Supabase
2. Ir na tabela `recurring_appointments`
3. Buscar o recorrente criado no Teste 3

**Query SQL:**
```sql
SELECT 
  id,
  customer_id,
  service_id,
  barber_id,
  frequency,
  day_of_week,
  time_of_day,
  is_active
FROM recurring_appointments
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
- ✅ Registro existe
- ✅ Campo `barber_id` está preenchido (UUID do barbeiro)
- ✅ Outros campos corretos

**Status:** [ ] Passou [ ] Falhou

---

### Teste 7: Geração Automática (Manual)

**Objetivo:** Testar script de geração com barbeiro

**Passos:**
1. Abrir terminal
2. Navegar para o projeto:
   ```bash
   cd zap-corte-pro-main
   ```
3. Configurar variáveis de ambiente:
   ```bash
   # Windows PowerShell
   $env:VITE_SUPABASE_URL="sua_url"
   $env:SUPABASE_SERVICE_ROLE_KEY="sua_chave"
   ```
4. Executar script:
   ```bash
   npx tsx scripts/generate-recurring-appointments.ts
   ```

**Resultado Esperado:**
```
🚀 Iniciando geração de agendamentos recorrentes...
⏰ Data/Hora: 19/11/2025 10:30:00

📊 Total de recorrentes ativos: 2

📋 Processando: uuid-recorrente-1
📅 Próxima data: 25/11/2025
✅ Agendamento criado: João Silva - 25/11/2025 14:00
👤 Barbeiro atribuído: uuid-carlos

📋 Processando: uuid-recorrente-2
📅 Próxima data: 26/11/2025
⏰ Ainda faltam 7 dias, aguardando...

==================================================
📊 RESUMO DA EXECUÇÃO
==================================================
✅ Agendamentos gerados: 1
⏭️ Agendamentos ignorados: 1
❌ Erros: 0
==================================================

✅ Processo concluído com sucesso!
```

**Status:** [ ] Passou [ ] Falhou

---

### Teste 8: Verificar Agendamento Gerado no Banco

**Objetivo:** Confirmar que agendamento foi criado com barbeiro

**Passos:**
1. Acessar Supabase
2. Ir na tabela `appointments`
3. Buscar agendamentos recorrentes

**Query SQL:**
```sql
SELECT 
  id,
  customer_name,
  service_id,
  barber_id,
  scheduled_at,
  recurring_appointment_id,
  created_at
FROM appointments
WHERE recurring_appointment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
- ✅ Agendamento existe
- ✅ Campo `barber_id` está preenchido (mesmo UUID do recorrente)
- ✅ Campo `recurring_appointment_id` vincula ao recorrente
- ✅ Data e hora corretas

**Status:** [ ] Passou [ ] Falhou

---

### Teste 9: Visualizar no Dashboard PRO

**Objetivo:** Verificar que agendamento aparece na coluna correta

**Passos:**
1. Login com conta PRO
2. Ir no Dashboard
3. Navegar para a data do agendamento gerado
4. Visualizar calendário semanal

**Resultado Esperado:**
- ✅ Agendamento aparece na coluna do barbeiro correto (Carlos)
- ✅ Ícone 🔄 indica que é recorrente
- ✅ Informações corretas: cliente, serviço, horário
- ❌ NÃO aparece na coluna "Qualquer Barbeiro"

**Status:** [ ] Passou [ ] Falhou

---

### Teste 10: Desativar Recorrente

**Objetivo:** Verificar que desativar recorrente para geração

**Passos:**
1. Na lista de recorrentes, desativar o toggle (ON → OFF)
2. Executar script de geração novamente
3. Verificar logs

**Resultado Esperado:**
- ✅ Toggle muda para OFF
- ✅ Badge muda de "Ativo" para "Inativo"
- ✅ Script não gera novos agendamentos para este recorrente
- ✅ Log mostra: "⏭️ Recorrente inativo, ignorando"

**Status:** [ ] Passou [ ] Falhou

---

### Teste 11: Excluir Recorrente

**Objetivo:** Verificar que exclusão não afeta agendamentos já criados

**Passos:**
1. Anotar ID de um agendamento já gerado
2. Excluir o recorrente (ícone 🗑️)
3. Confirmar exclusão
4. Verificar agendamento existente

**Resultado Esperado:**
- ✅ Recorrente removido da lista
- ✅ Agendamentos já criados permanecem intactos
- ✅ Novos agendamentos não serão mais gerados

**Status:** [ ] Passou [ ] Falhou

---

## 📊 Resumo dos Testes

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| 1 | Campo não aparece (FREE) | [ ] | |
| 2 | Campo aparece (PRO) | [ ] | |
| 3 | Criar com barbeiro | [ ] | |
| 4 | Criar sem barbeiro | [ ] | |
| 5 | Editar barbeiro | [ ] | |
| 6 | Verificar banco (recorrente) | [ ] | |
| 7 | Geração automática | [ ] | |
| 8 | Verificar banco (agendamento) | [ ] | |
| 9 | Visualizar dashboard | [ ] | |
| 10 | Desativar recorrente | [ ] | |
| 11 | Excluir recorrente | [ ] | |

**Total:** 0/11 testes realizados

## 🐛 Problemas Encontrados

### Problema 1
**Descrição:**
**Teste Afetado:**
**Solução:**

### Problema 2
**Descrição:**
**Teste Afetado:**
**Solução:**

## ✅ Checklist Final

- [ ] Todos os testes passaram
- [ ] Sem erros no console
- [ ] Sem erros no Supabase
- [ ] Funcionalidade FREE não afetada
- [ ] Funcionalidade PRO completa
- [ ] Documentação atualizada
- [ ] Código commitado e em produção

## 📝 Notas Adicionais

**Data do Teste:**
**Testado por:**
**Ambiente:** [ ] Desenvolvimento [ ] Produção
**Versão:**

**Observações:**

---

## 🚀 Próximos Passos Após Testes

1. [ ] Marcar todos os testes como concluídos
2. [ ] Documentar problemas encontrados
3. [ ] Corrigir bugs identificados
4. [ ] Re-testar funcionalidades corrigidas
5. [ ] Validar com usuários reais
6. [ ] Monitorar logs de produção
7. [ ] Coletar feedback dos usuários

## 📞 Suporte

Em caso de problemas durante os testes:
1. Verificar console do navegador (F12)
2. Verificar logs do Supabase
3. Verificar variáveis de ambiente
4. Consultar documentação técnica
5. Revisar código das correções

---

**Documento criado em:** 19/11/2025
**Última atualização:** 19/11/2025
**Versão:** 1.0.0
