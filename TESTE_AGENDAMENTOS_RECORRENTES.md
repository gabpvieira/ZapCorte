# 🧪 Guia de Teste - Agendamentos Recorrentes

## 📍 Como Testar a Funcionalidade

### Pré-requisitos
1. Ter pelo menos um cliente cadastrado
2. Ter pelo menos um serviço ativo
3. Estar logado como barbeiro

### 1️⃣ Acessar a Aba de Recorrentes

1. Faça login no sistema
2. Acesse o menu "Meus Agendamentos"
3. Clique na aba **"Recorrentes"** (ícone de refresh circular)

### 2️⃣ Criar Agendamento Recorrente Semanal

1. **Clicar em "Novo Recorrente"**

2. **Preencher o formulário:**
   - **Cliente:** Selecione um cliente existente
   - **Serviço:** Selecione um serviço (ex: Corte Masculino)
   - **Frequência:** Semanal
   - **Dia da Semana:** Segunda-feira
   - **Horário:** 14:00
   - **Data de Início:** Hoje ou próxima segunda
   - **Data de Término:** (deixar vazio para sem fim)
   - **Observações:** "Cliente regular - corte baixo"

3. **Clicar em "Criar"**

4. **Verificar:**
   - Card aparece na lista
   - Status está "Ativo" (verde)
   - Informações estão corretas
   - Descrição mostra "Toda Segunda-feira às 14:00"

### 3️⃣ Criar Agendamento Recorrente Quinzenal

1. **Clicar em "Novo Recorrente"**

2. **Preencher:**
   - **Cliente:** Outro cliente
   - **Serviço:** Barba
   - **Frequência:** Quinzenal
   - **Dia da Semana:** Sexta-feira
   - **Horário:** 10:00
   - **Data de Início:** Próxima sexta
   - **Data de Término:** Daqui a 3 meses

3. **Verificar:**
   - Descrição mostra "A cada 2 semanas (Sexta-feira) às 10:00"
   - Data de término está visível

### 4️⃣ Criar Agendamento Recorrente Mensal

1. **Clicar em "Novo Recorrente"**

2. **Preencher:**
   - **Cliente:** Outro cliente
   - **Serviço:** Corte + Barba
   - **Frequência:** Mensal
   - **Horário:** 16:00
   - **Data de Início:** Dia 15 do mês atual

3. **Verificar:**
   - Campo "Dia da Semana" não aparece (correto para mensal)
   - Descrição mostra "Mensalmente às 16:00"

### 5️⃣ Editar Agendamento Recorrente

1. **Clicar no ícone de editar** (lápis) em um card

2. **Modificar:**
   - Alterar horário de 14:00 para 15:00
   - Adicionar observação

3. **Salvar**

4. **Verificar:**
   - Informações foram atualizadas
   - Card reflete as mudanças

### 6️⃣ Desativar/Ativar Recorrente

1. **Clicar no toggle switch** (ativo/inativo)

2. **Verificar:**
   - Status muda para "Inativo" (cinza)
   - Borda do card fica cinza
   - Toast de confirmação aparece

3. **Clicar novamente no toggle**

4. **Verificar:**
   - Status volta para "Ativo" (verde)
   - Borda do card fica verde

### 7️⃣ Excluir Agendamento Recorrente

1. **Clicar no ícone de lixeira** (vermelho)

2. **Confirmar exclusão** no diálogo

3. **Verificar:**
   - Card é removido da lista
   - Toast de confirmação aparece

### 8️⃣ Testar Geração Automática (Manual)

**Opção A: Via Script (Recomendado)**

```bash
# No terminal, na pasta do projeto
cd zap-corte-pro-main

# Configurar variáveis de ambiente
export VITE_SUPABASE_URL="sua_url"
export SUPABASE_SERVICE_ROLE_KEY="sua_chave"

# Executar script
npx tsx scripts/generate-recurring-appointments.ts
```

**Opção B: Via Supabase SQL**

```sql
-- Simular geração manual
-- Buscar recorrentes ativos
SELECT * FROM recurring_appointments WHERE is_active = true;

-- Para cada um, criar agendamento manualmente
INSERT INTO appointments (
  barbershop_id,
  service_id,
  customer_name,
  customer_phone,
  scheduled_at,
  status,
  recurring_appointment_id
) VALUES (
  'barbershop_id_aqui',
  'service_id_aqui',
  'Nome do Cliente',
  '11999999999',
  '2024-12-09T14:00:00-03:00',
  'confirmed',
  'recurring_id_aqui'
);
```

**Verificar:**
1. Agendamento foi criado na aba "Lista"
2. Agendamento tem status "Confirmado"
3. Campo `recurring_appointment_id` está preenchido
4. `last_generated_date` foi atualizado no recorrente

### 9️⃣ Verificar Integração com Agendamentos Normais

1. **Ir para aba "Lista"**

2. **Verificar:**
   - Agendamentos gerados aparecem normalmente
   - Não há indicação visual diferente (comportamento esperado)
   - Podem ser editados/cancelados normalmente

3. **Editar um agendamento gerado:**
   - Alterar horário
   - Verificar que não afeta o recorrente original

4. **Cancelar um agendamento gerado:**
   - Verificar que não desativa o recorrente
   - Próximo agendamento será gerado normalmente

## ✅ Checklist de Validação

### Criação
- [ ] Formulário valida campos obrigatórios
- [ ] Cliente deve existir na base
- [ ] Serviço deve estar ativo
- [ ] Data de início é obrigatória
- [ ] Data de término é opcional
- [ ] Data de término deve ser posterior à data de início
- [ ] Dia da semana aparece apenas para semanal/quinzenal
- [ ] Dia da semana não aparece para mensal

### Listagem
- [ ] Cards mostram todas as informações
- [ ] Status ativo/inativo está visível
- [ ] Descrição da recorrência está correta
- [ ] Período (início/término) está visível
- [ ] Observações aparecem quando preenchidas
- [ ] Last generated date aparece quando disponível

### Edição
- [ ] Formulário carrega com dados atuais
- [ ] Todas as alterações são salvas
- [ ] Alterações não afetam agendamentos já criados

### Ativação/Desativação
- [ ] Toggle funciona corretamente
- [ ] Status visual muda (verde/cinza)
- [ ] Recorrentes inativos não geram agendamentos

### Exclusão
- [ ] Diálogo de confirmação aparece
- [ ] Exclusão remove da lista
- [ ] Agendamentos já criados permanecem

### Geração Automática
- [ ] Script roda sem erros
- [ ] Agendamentos são criados corretamente
- [ ] `recurring_appointment_id` está preenchido
- [ ] `last_generated_date` é atualizado
- [ ] Não cria duplicados
- [ ] Respeita período de validade
- [ ] Respeita status ativo/inativo

## 🐛 Problemas Comuns

### "Nenhum cliente cadastrado"
**Solução:** Crie um agendamento normal primeiro para cadastrar o cliente automaticamente.

### Script não roda
**Solução:** 
1. Verificar se `tsx` está instalado: `npm install -g tsx`
2. Verificar variáveis de ambiente
3. Verificar permissões do Supabase

### Agendamentos não são gerados
**Solução:**
1. Verificar se recorrente está ativo
2. Verificar se está dentro do período
3. Verificar se já foi gerado para a data
4. Verificar logs do script

### Data de término não funciona
**Solução:** Verificar formato da data (yyyy-MM-dd)

## 📊 Cenários de Teste Avançados

### Cenário 1: Cliente com Múltiplos Recorrentes
```
Cliente: João Silva
- Recorrente 1: Corte toda segunda às 14:00
- Recorrente 2: Barba toda quinta às 10:00

Resultado esperado:
- Ambos funcionam independentemente
- Não há conflito entre eles
```

### Cenário 2: Mesmo Horário, Clientes Diferentes
```
Segunda às 14:00:
- Cliente A: Corte
- Cliente B: Barba

Resultado esperado:
- Ambos são criados
- Sistema não valida conflito (barbeiro gerencia)
```

### Cenário 3: Recorrente com Data de Término
```
Início: 01/12/2024
Término: 31/12/2024
Frequência: Semanal

Resultado esperado:
- Gera agendamentos até 31/12
- Após 31/12, não gera mais
- Recorrente permanece na lista (inativo automaticamente)
```

### Cenário 4: Edição Durante Período Ativo
```
1. Criar recorrente semanal
2. Gerar primeiro agendamento
3. Editar horário do recorrente
4. Gerar segundo agendamento

Resultado esperado:
- Primeiro agendamento mantém horário antigo
- Segundo agendamento usa horário novo
```

### Cenário 5: Exclusão com Agendamentos Gerados
```
1. Criar recorrente
2. Gerar 3 agendamentos
3. Excluir recorrente

Resultado esperado:
- Recorrente é excluído
- 3 agendamentos permanecem
- Não gera novos agendamentos
```

## 🎯 Métricas de Sucesso

### Performance
- [ ] Lista carrega em < 1 segundo
- [ ] Criação/edição responde em < 500ms
- [ ] Script processa 100 recorrentes em < 30 segundos

### Usabilidade
- [ ] Interface intuitiva
- [ ] Feedback visual claro
- [ ] Mensagens de erro compreensíveis
- [ ] Formulário fácil de preencher

### Confiabilidade
- [ ] Não cria agendamentos duplicados
- [ ] Respeita todas as regras de negócio
- [ ] Não perde dados em caso de erro
- [ ] Logs claros para debugging

## 📝 Notas para Produção

### Antes de Ativar:
1. Testar script em ambiente de desenvolvimento
2. Configurar cron job no servidor
3. Configurar monitoramento de erros
4. Documentar para equipe

### Monitoramento:
1. Verificar logs diários do script
2. Monitorar taxa de sucesso/erro
3. Verificar feedback dos barbeiros
4. Ajustar horário de execução se necessário

### Manutenção:
1. Revisar recorrentes inativos mensalmente
2. Limpar recorrentes muito antigos
3. Otimizar queries se necessário
4. Atualizar documentação

---

**Boa sorte nos testes! 🚀**

Se encontrar algum problema, verifique:
1. Console do navegador (F12)
2. Logs do Supabase
3. Logs do script
4. Documentação técnica
