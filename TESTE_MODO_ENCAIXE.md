# Teste do Modo Encaixe

## Passo 1: Executar Script SQL

Antes de testar, você precisa adicionar a coluna `is_fit_in` no banco de dados.

### No Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Copie e execute o conteúdo do arquivo `scripts/add-fit-in-column.sql`:

```sql
-- Adicionar coluna is_fit_in na tabela appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_fit_in BOOLEAN DEFAULT FALSE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN appointments.is_fit_in IS 'Indica se o agendamento foi feito como encaixe (sem validação de conflitos de horário)';

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_appointments_is_fit_in ON appointments(is_fit_in);
```

4. Clique em "Run" para executar

## Passo 2: Testar a Funcionalidade

### Teste 1: Criar Agendamento Normal (Dashboard)
1. Acesse o "Dashboard"
2. Clique no card "Novo Agendamento" (atalho rápido)
3. Preencha os dados normalmente
4. NÃO ative o switch "Modo Encaixe" (deixe desligado)
5. Observe o design do card: fundo preto com borda amarela e switch
6. Crie o agendamento
7. Verifique que ele aparece normalmente na lista (sem badge de encaixe)

### Teste 1.1: Criar Agendamento Normal (Página de Agendamentos)
1. Acesse "Meus Agendamentos"
2. Clique em "Novo Agendamento"
3. Preencha os dados normalmente
4. NÃO marque o checkbox "Modo Encaixe"
5. Crie o agendamento
6. Verifique que ele aparece normalmente na lista (sem badge de encaixe)

### Teste 2: Criar Agendamento como Encaixe (Dashboard)
1. No Dashboard, clique em "Novo Agendamento" novamente
2. Preencha os dados
3. Selecione o MESMO horário do agendamento anterior
4. ATIVE o switch "Modo Encaixe" (clique para ligar)
5. Observe:
   - Card com fundo preto gradiente
   - Borda amarela brilhante
   - Ícone de raio amarelo
   - Switch amarelo quando ativado
   - Mensagem explicativa clara
6. Crie o agendamento
7. Verifique que:
   - O agendamento foi criado com sucesso
   - Aparece um badge amarelo "ENCAIXE" ao lado do status
   - Ao passar o mouse sobre o badge, aparece o tooltip explicativo

### Teste 2.1: Criar Agendamento como Encaixe (Página de Agendamentos)
1. Em "Meus Agendamentos", clique em "Novo Agendamento"
2. Preencha os dados
3. Selecione o MESMO horário do agendamento anterior
4. MARQUE o checkbox "Modo Encaixe"
5. Observe a mensagem explicativa no checkbox
6. Crie o agendamento
7. Verifique que:
   - O agendamento foi criado com sucesso
   - Aparece um badge amarelo "ENCAIXE" ao lado do status
   - Ao passar o mouse sobre o badge, aparece o tooltip explicativo

### Teste 3: Design do Card Modo Encaixe
1. Abra o formulário de novo agendamento
2. Verifique o design do card "Modo Encaixe":
   - ✅ Fundo preto gradiente (zinc-900 para amber-950)
   - ✅ Borda amarela brilhante (amber-500)
   - ✅ Ícone de raio amarelo em caixa com fundo
   - ✅ Switch ao invés de checkbox
   - ✅ Switch fica amarelo quando ativado
   - ✅ Texto branco e cinza claro
   - ✅ Efeito de brilho sutil no fundo
3. Teste ativar/desativar o switch várias vezes

### Teste 4: Visualização dos Badges
1. Na lista de agendamentos, verifique:
   - Agendamentos normais: apenas badge de status
   - Agendamentos de encaixe: badge de status + badge "ENCAIXE" amarelo
2. Teste em mobile e desktop para ver a responsividade

### Teste 5: Editar Agendamento
1. Edite um agendamento de encaixe
2. Verifique que o switch "Modo Encaixe" vem ativado
3. Desative o switch
4. Salve
5. Verifique que o badge "ENCAIXE" desaparece

## Resultado Esperado

✅ Card "Modo Encaixe" com design premium:
   - Fundo preto gradiente
   - Borda amarela brilhante
   - Ícone de raio amarelo
   - Switch ao invés de checkbox
   - Switch amarelo quando ativado
✅ Mensagem explicativa clara sobre o que é o modo encaixe
✅ Permite criar agendamentos em horários já ocupados quando ativado
✅ Badge "ENCAIXE" amarelo aparece nos agendamentos criados neste modo
✅ Tooltip explicativo ao passar o mouse sobre o badge
✅ Funciona tanto em mobile quanto em desktop
✅ Não interfere no funcionamento normal dos agendamentos

## Benefícios para o Barbeiro

- Flexibilidade total para fazer encaixes
- Não precisa usar "gambiarras" como agendar com serviço errado
- Identificação visual clara de quais são encaixes
- Mantém a organização da agenda
- Útil para serviços rápidos ou quando o barbeiro sabe que pode sobrepor atendimentos
