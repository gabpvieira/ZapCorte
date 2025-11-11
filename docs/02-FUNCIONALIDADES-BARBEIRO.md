# 💼 Funcionalidades para Barbeiros

## 📊 Dashboard Completo

### Visão Geral
O Dashboard é o centro de controle da sua barbearia, oferecendo uma visão completa e em tempo real do seu negócio.

### Métricas Principais
- **Total de Agendamentos** - Quantidade total de agendamentos
- **Agendamentos Hoje** - Horários marcados para hoje
- **Agendamentos Pendentes** - Aguardando confirmação
- **Agendamentos Confirmados** - Já confirmados

### Agendamentos de Hoje
- Lista visual dos agendamentos do dia
- Informações do cliente (nome, telefone)
- Serviço contratado
- Horário do atendimento
- Status (pendente, confirmado, cancelado)
- Ações rápidas (visualizar, editar, cancelar)

### Atalhos Rápidos Premium
1. **Novo Agendamento**
   - Criar agendamento manual rapidamente
   - Buscar cliente existente
   - Preenchimento automático de dados
   - Seleção de serviço, data e horário

2. **Ver Todos os Agendamentos**
   - Acesso rápido à página completa
   - Filtros avançados
   - Gestão completa

3. **Gerenciar Serviços**
   - Acesso direto aos serviços
   - Adicionar/editar rapidamente

---

## ✂️ Gestão de Serviços

### Funcionalidades
- **Criar Serviços** - Nome, preço e duração
- **Editar Serviços** - Atualizar informações
- **Excluir Serviços** - Remover serviços não utilizados
- **Ordenar Serviços** - Organizar por preferência

### Informações do Serviço
- **Nome** - Ex: Corte Masculino, Barba, Combo
- **Preço** - Valor cobrado (R$)
- **Duração** - Tempo necessário (minutos)
- **Descrição** - Detalhes do serviço (opcional)

### Exemplos de Serviços
```
Corte Masculino - R$ 35,00 - 30 min
Barba - R$ 25,00 - 20 min
Combo (Corte + Barba) - R$ 50,00 - 45 min
Corte Infantil - R$ 25,00 - 25 min
Sobrancelha - R$ 15,00 - 15 min
```

### Benefícios
- ✅ Clientes veem preços antes de agendar
- ✅ Sistema calcula horários automaticamente
- ✅ Organização profissional
- ✅ Transparência de valores

---

## 📅 Gestão de Agendamentos

### Visualização
- **Lista Completa** - Todos os agendamentos
- **Filtros** - Por data, status, serviço
- **Busca** - Por nome ou telefone do cliente
- **Ordenação** - Por data, status, criação

### Status dos Agendamentos
1. **Pendente** (Amarelo)
   - Cliente agendou online
   - Aguardando confirmação do barbeiro
   - Ações: Aceitar ou Cancelar

2. **Confirmado** (Verde)
   - Barbeiro confirmou o agendamento
   - Cliente recebeu confirmação via WhatsApp
   - Ações: Reagendar ou Cancelar

3. **Cancelado** (Vermelho)
   - Agendamento foi cancelado
   - Registro mantido para histórico
   - Ações: Visualizar apenas

### Ações Disponíveis

#### Aceitar Agendamento
- Confirma o horário
- Envia mensagem automática via WhatsApp
- Muda status para "Confirmado"
- Cliente recebe confirmação

#### Reagendar
- Escolher nova data
- Escolher novo horário
- Sistema verifica disponibilidade
- Cliente é notificado

#### Cancelar
- Cancela o agendamento
- Libera o horário
- Registro mantido no histórico
- Cliente pode ser notificado

#### Visualizar Detalhes
- Informações completas do cliente
- Serviço contratado
- Data e horário
- Observações
- Histórico de ações

### Criação Manual de Agendamentos
- Buscar cliente existente ou criar novo
- Selecionar serviço
- Escolher data
- Ver horários disponíveis em tempo real
- Confirmar agendamento
- WhatsApp enviado automaticamente

---

## 👥 Gestão de Clientes

### Carteira de Clientes
- **Lista Completa** - Todos os clientes cadastrados
- **Busca Rápida** - Por nome ou telefone
- **Estatísticas** - Total de clientes
- **Ordenação** - Alfabética

### Informações do Cliente
- **Nome Completo** - Identificação
- **Telefone (WhatsApp)** - Contato
- **Observações** - Preferências, alergias, notas
- **Data de Cadastro** - Quando foi criado
- **Total de Agendamentos** - Histórico

### Funcionalidades

#### Adicionar Cliente
- Nome e telefone obrigatórios
- Observações opcionais
- Validação de duplicidade
- Criação instantânea

#### Editar Cliente
- Atualizar informações
- Adicionar observações
- Corrigir dados

#### Excluir Cliente
- Confirmação necessária
- Remove permanentemente
- Histórico de agendamentos mantido

#### Buscar Cliente
- Busca em tempo real
- Por nome ou telefone
- Resultados instantâneos

### Criação Automática
- Cliente agenda online → criado automaticamente
- Evita duplicatas
- Observação automática com data
- Pronto para uso imediato

### Integração com Agendamentos
- Ao criar agendamento manual
- Dropdown com lista de clientes
- Seleção rápida
- Preenchimento automático
- Opção de criar novo cliente inline

---

## 💬 Integração WhatsApp

### Conexão
- **Evolution API** - Tecnologia robusta
- **QR Code** - Conexão rápida e segura
- **Status** - Conectado/Desconectado
- **Reconexão** - Automática se cair

### Mensagens Automáticas

#### 1. Confirmação de Agendamento
**Quando:** Barbeiro aceita agendamento ou cria manualmente  
**Conteúdo:**
```
🎉 Agendamento Confirmado!

Olá João!

Seu agendamento foi confirmado:
📅 Data: Segunda-feira, 15/11/2025
🕐 Horário: 14:00
✂️ Serviço: Corte Masculino
👨‍💼 Profissional: Gabriel
🏪 Local: Gabriel Barbeiro

Estamos ansiosos para atendê-lo!
```

#### 2. Lembrete de Agendamento
**Quando:** Antes do horário (configurável)  
**Conteúdo:**
```
⏰ Lembrete de Agendamento

Olá João!

Lembrete do seu agendamento:
📅 Data: Segunda-feira, 15/11/2025
🕐 Horário: 14:00
✂️ Serviço: Corte Masculino

Nos vemos em breve!
```

#### 3. Cancelamento
**Quando:** Agendamento é cancelado  
**Conteúdo:**
```
❌ Agendamento Cancelado

Olá João,

Seu agendamento foi cancelado:
📅 Data: Segunda-feira, 15/11/2025
🕐 Horário: 14:00

Para reagendar, entre em contato.
```

### Personalização de Mensagens
- **Variáveis Disponíveis:**
  - `{{primeiro_nome}}` - Primeiro nome do cliente
  - `{{servico}}` - Nome do serviço
  - `{{data}}` - Data formatada
  - `{{hora}}` - Horário
  - `{{barbearia}}` - Nome da barbearia
  - `{{barbeiro}}` - Nome do barbeiro
  - `{{dia_semana}}` - Dia da semana

- **Exemplo Personalizado:**
```
Fala {{primeiro_nome}}! 👊

Confirmado seu horário:
📅 {{dia_semana}}, {{data}}
🕐 {{hora}}
✂️ {{servico}}

Te espero aqui na {{barbearia}}!

Abraço,
{{barbeiro}}
```

### Configurações WhatsApp
- Conectar/Desconectar
- Testar conexão
- Personalizar mensagens
- Ver histórico de envios
- Configurar lembretes

---

## 🏪 Personalização da Barbearia

### Informações Básicas
- **Nome da Barbearia** - Identificação
- **Slug** - URL personalizada (ex: /gabrielbarbeiro)
- **Descrição** - Sobre a barbearia
- **Telefone** - Contato
- **Endereço** - Localização

### Identidade Visual
- **Logo** - Upload de imagem
- **Cores** - Personalização da página
- **Banner** - Imagem de destaque
- **Fotos** - Galeria de trabalhos

### Horários de Funcionamento
- **Dias da Semana** - Ativar/Desativar
- **Horário de Abertura** - Início do expediente
- **Horário de Fechamento** - Fim do expediente
- **Intervalo** - Horário de almoço (opcional)
- **Feriados** - Dias especiais

### Configurações de Agendamento
- **Antecedência Mínima** - Ex: 2 horas
- **Antecedência Máxima** - Ex: 30 dias
- **Intervalo entre Horários** - Ex: 15 minutos
- **Permitir Agendamento Simultâneo** - Sim/Não

### Link Personalizado
```
https://zapcorte.com/barbershop/gabrielbarbeiro
```
- Fácil de compartilhar
- Memorável
- Profissional

---

## 📈 Plano e Conta

### Informações da Conta
- **Email** - Login
- **Nome** - Identificação
- **Plano Atual** - Freemium ou Premium
- **Status** - Ativo/Inativo
- **Data de Vencimento** - Se Premium

### Upgrade para Premium
- **Benefícios:**
  - WhatsApp integrado
  - Mensagens ilimitadas
  - Personalização avançada
  - Suporte prioritário
  - Sem anúncios

- **Pagamento:**
  - Integração com Cakto
  - Cartão de crédito
  - Pix
  - Boleto

### Gerenciamento
- Ver histórico de pagamentos
- Atualizar forma de pagamento
- Cancelar assinatura
- Baixar recibos

---

## 🔔 Notificações

### OneSignal (Push Notifications)
- **Novo Agendamento** - Cliente agendou online
- **Cancelamento** - Cliente cancelou
- **Lembrete** - Agendamento próximo
- **Sistema** - Atualizações importantes

### Configurações
- Ativar/Desativar notificações
- Escolher tipos de notificação
- Som personalizado
- Horário de silêncio

---

## 📱 Acesso Multi-Dispositivo

### Desktop
- Interface completa
- Todas as funcionalidades
- Visualização otimizada
- Produtividade máxima

### Tablet
- Layout adaptado
- Touch-friendly
- Portabilidade
- Uso em movimento

### Mobile
- Responsivo total
- Menu lateral deslizante
- Botões grandes
- Uso com uma mão

---

## 💡 Dicas e Melhores Práticas

### Para Maximizar Agendamentos
1. Mantenha serviços atualizados
2. Responda agendamentos rapidamente
3. Personalize mensagens WhatsApp
4. Compartilhe seu link nas redes sociais
5. Adicione link na bio do Instagram

### Para Organização
1. Confirme agendamentos diariamente
2. Mantenha carteira de clientes atualizada
3. Adicione observações sobre preferências
4. Use filtros para visualizar agenda
5. Revise estatísticas semanalmente

### Para Crescimento
1. Peça avaliações aos clientes
2. Ofereça desconto para primeira vez
3. Crie programa de fidelidade
4. Compartilhe fotos de trabalhos
5. Incentive indicações

---

**Próximo:** [Funcionalidades para Clientes →](./03-FUNCIONALIDADES-CLIENTE.md)
