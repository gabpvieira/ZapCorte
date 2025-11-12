# 📱 Comportamento: Clientes e Telefones

## 🎯 Regra Principal

**Um telefone = Um cliente**

A tabela `customers` tem uma constraint única em `(barbershop_id, phone)`, o que significa que **não podem existir dois clientes com o mesmo telefone na mesma barbearia**.

## 🔄 Como Funciona o Trigger Atualizado

### Cenário 1: Cliente Novo
```
Agendamento: "João Silva" - 11999999999
Ação: Criar novo cliente
Resultado: 
  - Nome: "João Silva"
  - Telefone: 11999999999
  - Notas: "Cliente criado automaticamente via agendamento"
```

### Cenário 2: Mesmo Cliente, Mesmo Nome
```
1º Agendamento: "João Silva" - 11999999999
2º Agendamento: "João Silva" - 11999999999
Ação: Atualizar data (updated_at)
Resultado: 
  - Nome: "João Silva" (mantido)
  - Telefone: 11999999999
  - Notas: (sem alteração)
```

### Cenário 3: Mesmo Telefone, Nome Diferente
```
1º Agendamento: "João Silva" - 11999999999
2º Agendamento: "João S." - 11999999999
Ação: Manter nome original + adicionar nota
Resultado: 
  - Nome: "João Silva" (mantido - primeiro nome)
  - Telefone: 11999999999
  - Notas: 
    "Cliente criado automaticamente via agendamento
    [12/11/2025 14:30] Agendamento feito com nome: 'João S.'"
```

### Cenário 4: Pessoas Diferentes, Mesmo Telefone
```
1º Agendamento: "João" - 11999999999
2º Agendamento: "Maria" - 11999999999 (esposa)
Ação: Manter nome original + adicionar nota
Resultado: 
  - Nome: "João" (mantido - primeiro a agendar)
  - Telefone: 11999999999
  - Notas: 
    "Cliente criado automaticamente via agendamento
    [12/11/2025 15:00] Agendamento feito com nome: 'Maria'"
```

## 💡 Por Que Funciona Assim?

### Vantagens:
1. **Evita Duplicatas**: Um telefone não gera múltiplos clientes
2. **Histórico Preservado**: Primeiro nome é mantido
3. **Rastreabilidade**: Notas mostram variações de nome
4. **Flexibilidade**: Barbeiro pode ver e corrigir manualmente

### Casos de Uso Reais:

#### Caso 1: Variações do Nome
```
- "João Silva"
- "João S."
- "João"
- "Joao Silva" (sem acento)
```
**Solução**: Mantém primeiro nome, registra variações nas notas.

#### Caso 2: Família Compartilhando Telefone
```
- Pai agenda: "Carlos"
- Filho agenda: "Carlos Jr."
- Mãe agenda: "Ana"
```
**Solução**: Mantém "Carlos" (primeiro), registra outros nas notas.
**Ação do Barbeiro**: Pode criar clientes separados manualmente se necessário.

#### Caso 3: Erro de Digitação
```
- 1º: "Joao Silva" (sem acento)
- 2º: "João Silva" (com acento)
```
**Solução**: Mantém "Joao Silva", registra "João Silva" nas notas.
**Ação do Barbeiro**: Pode editar o nome correto manualmente.

## 🛠️ Como o Barbeiro Pode Gerenciar

### Ver Variações de Nome:
1. Acessar "Meus Clientes"
2. Clicar no cliente
3. Ver campo "Notas"
4. Verificar histórico de nomes usados

### Corrigir Nome:
1. Editar cliente
2. Atualizar nome para o correto
3. Salvar

### Criar Cliente Separado:
Se realmente forem pessoas diferentes:
1. Criar novo cliente manualmente
2. Usar telefone diferente (ou adicionar dígito extra)
3. Adicionar nota explicando

## 📊 Exemplos Práticos

### Exemplo 1: Cliente Regular
```sql
-- 1º Agendamento
Nome: "João Silva"
Telefone: "11999999999"
Notas: "Cliente criado automaticamente via agendamento"

-- 2º Agendamento (mesmo nome)
Nome: "João Silva" (mantido)
Notas: (sem alteração)

-- 3º Agendamento (nome abreviado)
Nome: "João Silva" (mantido)
Notas: "Cliente criado automaticamente via agendamento
[12/11/2025 14:30] Agendamento feito com nome: 'João S.'"
```

### Exemplo 2: Família
```sql
-- Pai agenda primeiro
Nome: "Carlos Souza"
Telefone: "11988888888"
Notas: "Cliente criado automaticamente via agendamento"

-- Filho agenda depois
Nome: "Carlos Souza" (mantido - nome do pai)
Notas: "Cliente criado automaticamente via agendamento
[12/11/2025 15:00] Agendamento feito com nome: 'Carlos Jr.'"

-- Barbeiro vê a nota e pode:
-- Opção 1: Manter assim (mesmo telefone, família)
-- Opção 2: Criar cliente separado para o filho
```

## 🔍 Consultas Úteis

### Ver clientes com variações de nome:
```sql
SELECT name, phone, notes
FROM customers
WHERE notes LIKE '%Agendamento feito com nome:%'
ORDER BY updated_at DESC;
```

### Ver histórico de um telefone:
```sql
SELECT 
  c.name,
  c.phone,
  c.notes,
  COUNT(a.id) as total_agendamentos
FROM customers c
LEFT JOIN appointments a ON a.customer_phone = c.phone
WHERE c.phone = '11999999999'
GROUP BY c.id;
```

## ⚙️ Configuração Técnica

### Constraint Única:
```sql
UNIQUE (barbershop_id, phone)
```

### Trigger:
```sql
CREATE TRIGGER trigger_auto_create_customer
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION auto_create_customer_from_appointment();
```

### Lógica:
1. Verifica se telefone já existe
2. Se não existe: cria novo cliente
3. Se existe e nome igual: atualiza data
4. Se existe e nome diferente: adiciona nota

## 📝 Recomendações

### Para o Barbeiro:
1. **Revisar periodicamente** a página de clientes
2. **Verificar notas** de clientes com variações
3. **Corrigir nomes** quando necessário
4. **Criar clientes separados** se forem pessoas diferentes

### Para o Sistema:
1. ✅ Mantém integridade dos dados
2. ✅ Evita duplicatas
3. ✅ Preserva histórico
4. ✅ Permite correção manual

## 🎯 Conclusão

O sistema prioriza:
1. **Não duplicar** clientes pelo telefone
2. **Preservar** o primeiro nome registrado
3. **Registrar** variações nas notas
4. **Permitir** correção manual pelo barbeiro

Isso garante uma base de clientes limpa e organizada, com flexibilidade para casos especiais! 💈✨

---

**Status**: ✅ Implementado e Documentado

**Data**: 12/11/2025

**Comportamento**: Inteligente e Flexível
