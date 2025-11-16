# Como Testar o Preview Rico do Link

## 🔍 Ferramentas de Teste

### 1. Facebook/WhatsApp Debugger
**URL:** https://developers.facebook.com/tools/debug/

**Como usar:**
1. Cole a URL da barbearia: `https://zapcorte.com/barbershop/{slug}`
2. Clique em "Debug"
3. Clique em "Scrape Again" para forçar atualização
4. Verifique se aparece:
   - Título: "{Nome da Barbearia} - Agende Online | ZapCorte"
   - Descrição: Subtitle da barbearia
   - Imagem: Logo da barbearia

### 2. Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator

**Como usar:**
1. Cole a URL da barbearia
2. Clique em "Preview card"
3. Verifique o preview

### 3. LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/

**Como usar:**
1. Cole a URL
2. Clique em "Inspect"
3. Verifique o preview

## 📱 Teste no WhatsApp

### Método 1: Enviar para si mesmo
1. Abra o WhatsApp
2. Envie a URL para você mesmo (Mensagens Arquivadas)
3. Aguarde alguns segundos
4. O preview deve aparecer automaticamente

### Método 2: Usar WhatsApp Web
1. Abra https://web.whatsapp.com
2. Cole a URL em qualquer conversa
3. Aguarde o preview carregar

## 🔧 Troubleshooting

### Preview não aparece
1. **Limpe o cache do Facebook:**
   - Acesse o Facebook Debugger
   - Cole a URL
   - Clique em "Scrape Again" várias vezes

2. **Verifique a URL da imagem:**
   - A logo da barbearia deve ser acessível publicamente
   - Teste abrindo a URL da logo diretamente no navegador
   - Certifique-se que não há erro de CORS

3. **Aguarde alguns minutos:**
   - Às vezes o WhatsApp demora para atualizar o cache
   - Tente novamente após 5-10 minutos

### Imagem não carrega
1. **Verifique o formato:**
   - Deve ser PNG ou JPG
   - Tamanho recomendado: 1200x630px
   - Peso máximo: 5MB

2. **Verifique a URL:**
   - Deve começar com `https://`
   - Deve ser acessível publicamente
   - Não pode ter autenticação

### Descrição não aparece
1. **Verifique o subtitle:**
   - A barbearia deve ter um subtitle configurado
   - Máximo de 160 caracteres
   - Sem caracteres especiais problemáticos

## ✅ Checklist de Verificação

- [ ] URL da barbearia está acessível
- [ ] Logo da barbearia está configurada
- [ ] Subtitle está preenchido
- [ ] Facebook Debugger mostra o preview correto
- [ ] WhatsApp mostra o preview ao colar o link
- [ ] Título aparece corretamente
- [ ] Descrição aparece corretamente
- [ ] Imagem carrega corretamente

## 📊 Exemplo de Preview Esperado

```
┌─────────────────────────────────┐
│                                 │
│    [Logo da Barbearia]          │
│                                 │
│  Barbearia do João              │
│  Agende Online | ZapCorte       │
│                                 │
│  Cortes modernos e barba        │
│  profissional. Agende seu       │
│  horário online de forma        │
│  rápida e fácil.                │
│                                 │
│  zapcorte.com                   │
│                                 │
└─────────────────────────────────┘
```

## 🚀 Dicas para Melhor Preview

1. **Logo Quadrada:**
   - Use uma logo quadrada (1:1)
   - Mínimo: 400x400px
   - Recomendado: 800x800px

2. **Descrição Atrativa:**
   - Use call-to-action
   - Seja claro e direto
   - Destaque diferenciais

3. **Teste Regularmente:**
   - Teste após cada alteração
   - Limpe o cache do Facebook
   - Verifique em diferentes plataformas

## 📝 Notas Importantes

- O preview pode demorar alguns minutos para atualizar
- O WhatsApp usa o cache do Facebook
- Sempre use o Facebook Debugger para forçar atualização
- A imagem deve ser HTTPS (não HTTP)
- Meta tags são atualizadas dinamicamente via JavaScript
