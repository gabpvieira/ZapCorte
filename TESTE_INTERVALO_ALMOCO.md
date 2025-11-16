# 🧪 Guia de Teste - Intervalo de Almoço

## 📍 Como Testar a Funcionalidade

### 1️⃣ Acessar a Página de Configurações

1. Faça login no sistema
2. Acesse o menu "Personalizar Barbearia"
3. Role a página até encontrar o card **"Intervalo de Almoço"** (com ícone de relógio laranja)

### 2️⃣ Configurar o Intervalo

1. **Ativar o intervalo:**
   - Clique no switch "Ativar Intervalo de Almoço"
   - Os campos de horário aparecerão

2. **Definir horários:**
   - **Início do Intervalo:** 13:00 (ou outro horário desejado)
   - **Fim do Intervalo:** 14:00 (ou outro horário desejado)

3. **Salvar:**
   - Clique no botão "Salvar Alterações" no final da página
   - Aguarde a confirmação de sucesso

### 3️⃣ Verificar o Bloqueio

1. **Abrir o site público da barbearia:**
   - Clique em "Ver Meu Site" no final da página de configurações
   - OU acesse diretamente: `/barbershop/[seu-slug]`

2. **Iniciar um agendamento:**
   - Escolha qualquer serviço
   - Clique em "Agendar Agora"

3. **Selecionar uma data:**
   - Escolha uma data (hoje ou futura)
   - Observe os horários disponíveis

4. **Verificar bloqueio:**
   - Os horários entre 13:00 e 14:00 devem aparecer como **indisponíveis** (riscados/desabilitados)
   - Você não conseguirá clicar nestes horários

### 4️⃣ Testar Colisões

**Cenário 1: Serviço que termina durante o almoço**
- Serviço de 60 minutos
- Tentar agendar às 12:30
- **Resultado esperado:** Horário bloqueado (pois o serviço terminaria às 13:30, durante o almoço)

**Cenário 2: Serviço que começa após o almoço**
- Serviço de 60 minutos
- Tentar agendar às 14:00
- **Resultado esperado:** Horário disponível ✅

**Cenário 3: Serviço curto antes do almoço**
- Serviço de 30 minutos
- Tentar agendar às 12:30
- **Resultado esperado:** Horário disponível ✅ (termina às 13:00)

### 5️⃣ Desativar o Intervalo

1. Volte para "Personalizar Barbearia"
2. Desative o switch "Ativar Intervalo de Almoço"
3. Salve as alterações
4. Verifique que todos os horários voltam a ficar disponíveis

## ✅ Checklist de Validação

- [ ] Switch ativa/desativa corretamente
- [ ] Campos de horário aparecem apenas quando ativado
- [ ] Não permite salvar com horário de início >= fim
- [ ] Horários durante o intervalo ficam bloqueados
- [ ] Serviços que colidem parcialmente são bloqueados
- [ ] Desativar o intervalo libera todos os horários
- [ ] Configuração persiste após recarregar a página
- [ ] Funciona em diferentes dias da semana

## 🐛 Problemas Comuns

### Horários não estão bloqueando
- Verifique se o switch está ativado
- Confirme que salvou as alterações
- Recarregue a página de agendamento

### Erro ao salvar
- Verifique se o horário de início é menor que o de fim
- Confirme que os horários estão no formato correto (HH:MM)

### Configuração não persiste
- Verifique a conexão com o banco de dados
- Confirme que não há erros no console do navegador

## 📊 Exemplos de Teste

### Exemplo 1: Almoço padrão
```
Início: 13:00
Fim: 14:00
Resultado: Bloqueia 1 hora de almoço
```

### Exemplo 2: Almoço estendido
```
Início: 12:00
Fim: 14:00
Resultado: Bloqueia 2 horas de almoço
```

### Exemplo 3: Pausa curta
```
Início: 13:00
Fim: 13:30
Resultado: Bloqueia 30 minutos
```

## 🎯 Casos de Uso Reais

1. **Barbeiro que almoça das 13h às 14h:**
   - Configura intervalo 13:00 - 14:00
   - Clientes não podem agendar neste horário
   - Barbeiro tem garantia de pausa

2. **Barbearia com horário de almoço flexível:**
   - Pode ativar/desativar conforme necessidade
   - Útil para dias de movimento diferente

3. **Múltiplos barbeiros (futuro):**
   - Cada barbeiro poderia ter seu próprio intervalo
   - Requer extensão da funcionalidade atual

## 📝 Notas Importantes

- O intervalo é aplicado em **todos os dias de funcionamento**
- Não afeta dias marcados como "Fechado"
- Funciona junto com os horários de funcionamento normais
- Respeita o timezone brasileiro (UTC-3)
- Validação automática impede configurações inválidas

## 🚀 Próximos Testes (Opcional)

1. Testar com diferentes durações de serviço (15, 30, 60, 90 minutos)
2. Testar em diferentes dispositivos (mobile, tablet, desktop)
3. Testar com múltiplos agendamentos no mesmo dia
4. Verificar comportamento em dias com horários especiais
