# 🔄 Como Forçar Atualização do Preview de Links

## 📋 Problema

Redes sociais (WhatsApp, Facebook, etc.) fazem cache das meta tags Open Graph. Quando você atualiza o logo ou informações, o preview antigo pode continuar aparecendo.

## ✅ Soluções para Forçar Atualização

### 1. Facebook Debugger (Mais Eficaz)

**URL:** https://developers.facebook.com/tools/debug/

**Passos:**
1. Acesse o Facebook Debugger
2. Cole a URL: `https://www.zapcorte.com.br/barbershop/carvalhomozeli-barbearia`
3. Clique em "Depurar" (Debug)
4. Clique em "Buscar Novas Informações" (Scrape Again)
5. Aguarde o resultado

**Resultado:**
- ✅ Cache do Facebook atualizado
- ✅ WhatsApp usa o mesmo cache do Facebook
- ✅ Preview atualizado em ~5 minutos

### 2. Adicionar Parâmetro na URL (Temporário)

Adicione `?v=1` ao final da URL:
```
https://www.zapcorte.com.br/barbershop/carvalhomozeli-barbearia?v=1
```

Incremente o número a cada teste:
```
?v=2
?v=3
etc.
```

### 3. WhatsApp Business API

Se você tem WhatsApp Business API, pode limpar o cache:
```bash
curl -X DELETE \
  "https://graph.facebook.com/v18.0/debug_token?input_token=YOUR_TOKEN&access_token=YOUR_ACCESS_TOKEN"
```

### 4. Telegram

Telegram tem seu próprio bot para atualizar previews:
1. Envie a URL para: @WebpageBot
2. O bot retorna o preview atualizado

## 🎯 Checklist de Verificação

Antes de compartilhar, verifique se:

### ✅ Logo está acessível
```bash
# Teste se o logo carrega
curl -I https://url-do-logo.jpg
```

**Deve retornar:**
- Status: 200 OK
- Content-Type: image/jpeg ou image/png

### ✅ Meta tags estão corretas

Inspecione o HTML da página:
```html
<meta property="og:image" content="URL_DO_LOGO" />
<meta property="og:title" content="Nome da Barbearia" />
<meta property="og:description" content="Descrição" />
```

### ✅ Dimensões da imagem

**Recomendado:**
- Largura: 1200px
- Altura: 630px
- Formato: JPG ou PNG
- Tamanho: < 8MB

**Mínimo:**
- Largura: 600px
- Altura: 315px

## 🔧 Ferramentas de Teste

### 1. Facebook Debugger
**URL:** https://developers.facebook.com/tools/debug/
**Testa:** Facebook, WhatsApp, Instagram

### 2. Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator
**Testa:** Twitter

### 3. LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/
**Testa:** LinkedIn

### 4. OpenGraph.xyz
**URL:** https://www.opengraph.xyz/
**Testa:** Visualização geral

## 📊 Tempo de Atualização

| Plataforma | Tempo Médio | Como Forçar |
|------------|-------------|-------------|
| Facebook | 24-48h | Facebook Debugger |
| WhatsApp | 24-48h | Facebook Debugger (mesmo cache) |
| Twitter | Imediato | Automático |
| LinkedIn | 7 dias | Post Inspector |
| Telegram | Imediato | @WebpageBot |

## 🚀 Processo Recomendado

### Para Nova Barbearia

```bash
1. Fazer upload do logo no Supabase
2. Salvar URL do logo na barbearia
3. Acessar a página: /barbershop/[slug]
4. Verificar se logo aparece na página
5. Abrir Facebook Debugger
6. Colar URL e clicar em "Depurar"
7. Verificar se logo aparece no preview
8. Clicar em "Buscar Novas Informações"
9. Compartilhar no WhatsApp
```

### Para Atualizar Logo Existente

```bash
1. Fazer upload do novo logo
2. Atualizar URL na barbearia
3. Limpar cache do navegador (Ctrl+Shift+R)
4. Acessar Facebook Debugger
5. Colar URL
6. Clicar em "Buscar Novas Informações" 2-3 vezes
7. Aguardar 5 minutos
8. Testar compartilhamento
```

## 🐛 Troubleshooting

### Problema: Logo não aparece no preview

**Possíveis causas:**
1. ❌ Logo não está acessível publicamente
2. ❌ URL do logo está incorreta
3. ❌ Logo tem dimensões muito pequenas
4. ❌ Cache ainda não foi atualizado

**Soluções:**
```bash
# 1. Verificar se logo carrega
curl -I https://url-do-logo.jpg

# 2. Verificar meta tags
curl https://www.zapcorte.com.br/barbershop/slug | grep "og:image"

# 3. Forçar atualização no Facebook
# Usar Facebook Debugger

# 4. Adicionar timestamp na URL
?v=timestamp
```

### Problema: Preview mostra informações antigas

**Solução:**
1. Limpar cache do Facebook Debugger
2. Adicionar `?v=2` na URL
3. Aguardar 5-10 minutos
4. Testar novamente

### Problema: Logo aparece cortado

**Solução:**
1. Redimensionar logo para 1200x630px
2. Centralizar conteúdo importante
3. Evitar texto muito pequeno
4. Usar fundo sólido

## 📝 Exemplo de Meta Tags Corretas

```html
<!-- Título -->
<meta property="og:title" content="Carvalho Mozeli Barbearia - Agende Online | ZapCorte" />

<!-- Descrição -->
<meta property="og:description" content="Agende seu horário na Carvalho Mozeli Barbearia de forma rápida e fácil." />

<!-- Imagem -->
<meta property="og:image" content="https://supabase.co/storage/v1/object/public/logos/carvalho-logo.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- URL -->
<meta property="og:url" content="https://www.zapcorte.com.br/barbershop/carvalhomozeli-barbearia" />

<!-- Tipo -->
<meta property="og:type" content="website" />
```

## 🎨 Dicas para Logo Ideal

### Dimensões
- **Ideal:** 1200x630px (proporção 1.91:1)
- **Mínimo:** 600x315px
- **Máximo:** 8MB

### Formato
- ✅ JPG (melhor compressão)
- ✅ PNG (melhor qualidade)
- ❌ GIF (não recomendado)
- ❌ SVG (não suportado)

### Conteúdo
- Logo centralizado
- Fundo sólido ou gradiente
- Texto legível (mínimo 40px)
- Cores contrastantes
- Sem bordas brancas excessivas

## 🔗 Links Úteis

- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Open Graph Protocol](https://ogp.me/)
- [WhatsApp Business](https://business.whatsapp.com/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

---

**Última atualização:** 16/11/2025
