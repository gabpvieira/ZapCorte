# 📱 Personalização de Mensagens WhatsApp - ZapCorte

## 🎯 Visão Geral

Sistema completo de personalização de mensagens automáticas do WhatsApp, permitindo que barbeiros customizem as mensagens de:
- ✅ **Confirmação** - Enviada após o agendamento
- 🔄 **Reagendamento** - Enviada quando o horário é alterado
- ⏰ **Lembrete** - Enviada antes do horário agendado

---

## ✨ Funcionalidades Implementadas

### 1. Interface Premium
- **Design moderno** inspirado em plataformas SaaS
- **Tabs organizadas** para cada tipo de mensagem
- **Preview em tempo real** mostrando como o cliente verá
- **Totalmente responsivo** (mobile-first)

### 2. Editor de Mensagens
- **Textarea com altura automática**
- **Suporte a emojis nativos** (copiar/colar)
- **Quebras de linha reais** (Enter funciona normalmente)
- **Fonte monoespaçada** para melhor visualização

### 3. Sistema de Variáveis
- **Botões clicáveis** para copiar variáveis
- **Substituição automática** no preview
- **Feedback visual** ao copiar

#### Variáveis Disponíveis:
```
{{primeiro_nome}} - Primeiro nome do cliente (ex: "João")
{{servico}} - Nome do serviço (ex: "Corte + Barba")
{{data}} - Data formatada (ex: "15/11/2024")
{{hora}} - Horário formatado (ex: "14:30")
{{barbearia}} - Nome da barbearia
```

### 4. Preview em Tempo Real
- **Simulação visual** do WhatsApp
- **Dados fictícios** para demonstração
- **Atualização instantânea** ao digitar
- **Formatação preservada** (emojis e quebras de linha)

### 5. Funcionalidades Extras
- **Restaurar padrão** - Volta para mensagem original
- **Salvar tudo** - Salva as 3 mensagens de uma vez
- **Loading states** - Feedback visual durante operações
- **Toast notifications** - Confirmações amigáveis

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `barbershops`

Novas colunas adicionadas:

```sql
confirmation_message TEXT  -- Mensagem de confirmação
reschedule_message TEXT    -- Mensagem de reagendamento
reminder_message TEXT      -- Mensagem de lembrete
```

### Migração SQL

Execute o arquivo `MIGRATION_MESSAGE_CUSTOMIZATION.sql` no Supabase:

```bash
# No Supabase Dashboard:
# 1. Vá em SQL Editor
# 2. Cole o conteúdo do arquivo
# 3. Execute (Run)
```

---

## 💻 Arquivos Criados/Modificados

### Novos Arquivos:
1. **`src/components/MessageCustomizer.tsx`**
   - Componente principal de personalização
   - 400+ linhas de código
   - Totalmente tipado com TypeScript

2. **`MIGRATION_MESSAGE_CUSTOMIZATION.sql`**
   - Script de migração do banco
   - Adiciona colunas com valores padrão

3. **`DOCS_PERSONALIZACAO_MENSAGENS.md`**
   - Documentação completa (este arquivo)

### Arquivos Modificados:
1. **`src/pages/WhatsAppSettings.tsx`**
   - Adicionado import do MessageCustomizer
   - Adicionado componente na página
   - Integrado com AuthContext

---

## 🔧 Como Usar

### Para o Desenvolvedor:

1. **Executar migração SQL:**
   ```sql
   -- Copie e execute MIGRATION_MESSAGE_CUSTOMIZATION.sql no Supabase
   ```

2. **Verificar imports:**
   ```typescript
   import MessageCustomizer from '@/components/MessageCustomizer';
   ```

3. **Usar o componente:**
   ```tsx
   <MessageCustomizer barbershopId={user.barbershop_id} />
   ```

### Para o Barbeiro (Usuário Final):

1. **Acessar:** Dashboard → WhatsApp → Configurações
2. **Escolher aba:** Confirmação, Reagendamento ou Lembrete
3. **Editar mensagem:**
   - Digite livremente
   - Use emojis
   - Clique nas variáveis para copiar
   - Cole com Ctrl+V
4. **Ver preview** em tempo real
5. **Salvar** quando estiver satisfeito

---

## 📝 Exemplos de Mensagens

### Confirmação (Formal):
```
Olá {{primeiro_nome}}! ✅

Seu agendamento foi confirmado:

📅 Data: {{data}}
🕐 Horário: {{hora}}
✂️ Serviço: {{servico}}
🏪 {{barbearia}}

Aguardamos você!
```

### Confirmação (Descontraída):
```
E aí {{primeiro_nome}}! 😎

Tá confirmado, mano! 🔥

📅 {{data}} às {{hora}}
✂️ {{servico}}

Cola aqui na {{barbearia}}!
Vai ficar top! 💈
```

### Lembrete (Com CTA):
```
Fala {{primeiro_nome}}! ⏰

Seu horário é HOJE às {{hora}}!

✂️ {{servico}}
📍 {{barbearia}}

Confirma aí? 👍
Responda SIM para confirmar.
```

---

## 🔄 Fluxo de Envio

### 1. Confirmação
```
Cliente agenda
    ↓
Sistema cria appointment
    ↓
Busca confirmation_message da barbearia
    ↓
Substitui variáveis
    ↓
Envia via Evolution API
```

### 2. Reagendamento
```
Cliente/Barbeiro altera horário
    ↓
Sistema atualiza appointment
    ↓
Busca reschedule_message
    ↓
Substitui variáveis
    ↓
Envia via Evolution API
```

### 3. Lembrete
```
Scheduler verifica reminder_jobs
    ↓
Horário chegou?
    ↓
Busca reminder_message
    ↓
Substitui variáveis
    ↓
Envia via Evolution API
```

---

## 🎨 Design System

### Cores por Tipo:
- **Confirmação:** Verde (`green-600`)
- **Reagendamento:** Azul (`blue-600`)
- **Lembrete:** Roxo (`purple-600`)

### Componentes UI:
- **Card** - Container principal
- **Tabs** - Navegação entre tipos
- **Textarea** - Editor de mensagem
- **Button** - Ações (copiar, salvar, restaurar)
- **Label** - Títulos de campos

### Animações:
- **Framer Motion** - Fade in + slide up
- **Hover effects** - Scale e cor
- **Loading states** - Spinner animado

---

## 🧪 Testes Sugeridos

### Teste 1: Salvar e Carregar
1. Edite uma mensagem
2. Salve
3. Recarregue a página
4. ✅ Mensagem deve estar salva

### Teste 2: Variáveis
1. Copie uma variável
2. Cole no editor
3. ✅ Deve aparecer no formato `{{variavel}}`
4. ✅ Preview deve substituir corretamente

### Teste 3: Emojis
1. Digite emojis nativos (😊 ✂️ 📅)
2. ✅ Devem aparecer no editor
3. ✅ Devem aparecer no preview
4. ✅ Devem ser enviados corretamente

### Teste 4: Quebras de Linha
1. Pressione Enter várias vezes
2. ✅ Quebras devem aparecer no editor
3. ✅ Quebras devem aparecer no preview
4. ✅ Quebras devem ser enviadas corretamente

### Teste 5: Restaurar Padrão
1. Edite uma mensagem
2. Clique em "Restaurar padrão"
3. ✅ Mensagem original deve voltar

---

## 🚀 Melhorias Futuras

### Curto Prazo:
- [ ] Adicionar mais variáveis (telefone, endereço)
- [ ] Histórico de mensagens enviadas
- [ ] Estatísticas de abertura/resposta

### Médio Prazo:
- [ ] Templates prontos para escolher
- [ ] Biblioteca de emojis integrada
- [ ] Teste de envio (enviar para si mesmo)

### Longo Prazo:
- [ ] IA para sugerir mensagens
- [ ] A/B testing de mensagens
- [ ] Personalização por serviço

---

## 🐛 Troubleshooting

### Problema: Mensagens não salvam
**Solução:** Verifique se as colunas foram criadas no banco
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'barbershops' 
AND column_name LIKE '%message%';
```

### Problema: Variáveis não substituem
**Solução:** Verifique o formato exato: `{{variavel}}` (com chaves duplas)

### Problema: Emojis não aparecem
**Solução:** Verifique se o banco suporta UTF-8:
```sql
SHOW SERVER_ENCODING; -- Deve ser UTF8
```

### Problema: Quebras de linha não funcionam
**Solução:** Use `\n` no código ou Enter no textarea

---

## 📚 Referências

### Documentação:
- [Evolution API](https://doc.evolution-api.com/)
- [Supabase](https://supabase.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)

### Inspirações de Design:
- Intercom
- Twilio
- SendGrid
- Mailchimp

---

## 👨‍💻 Desenvolvido por

**ZapCorte Team**
- Design Premium ✨
- UX Excepcional 🎯
- Performance Otimizada ⚡

---

**Última atualização:** 11/11/2024
**Versão:** 1.0.0
