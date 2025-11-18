# Implementação do Modo Encaixe

## Objetivo
Permitir que barbeiros façam agendamentos "encaixe" - agendamentos em horários já ocupados, útil quando o barbeiro sabe que pode atender mais rápido ou fazer sobreposições.

## Mudanças Implementadas

### 1. Banco de Dados
Adicionado campo `is_fit_in` (boolean) na tabela `appointments` para identificar agendamentos feitos como encaixe.

### 2. Interface do Usuário
- Checkbox "Modo Encaixe" no formulário de novo agendamento (Dashboard e Página de Agendamentos)
- Quando ativado, permite agendar em qualquer horário sem validação de conflitos
- Badge visual "ENCAIXE" nos agendamentos criados neste modo
- Tooltip explicativo sobre o que é o modo encaixe
- Implementado em dois locais:
  - Dashboard: Atalho rápido "Novo Agendamento"
  - Página de Agendamentos: Botão "Novo Agendamento"

### 3. Comportamento
- Modo Encaixe desabilitado por padrão
- Quando ativado, não valida conflitos de horário
- Agendamentos de encaixe são marcados visualmente na lista
- Funciona tanto para novos agendamentos quanto para edições

## Como Usar
1. Ao criar um novo agendamento, marque o checkbox "Modo Encaixe"
2. Selecione qualquer horário, mesmo que já esteja ocupado
3. O agendamento será criado e marcado como encaixe
4. Na lista, aparecerá com um badge "ENCAIXE" para fácil identificação

## Benefícios
- Flexibilidade para barbeiros experientes
- Permite otimizar a agenda com serviços rápidos
- Não interfere no funcionamento normal do sistema
- Fácil identificação visual dos encaixes
