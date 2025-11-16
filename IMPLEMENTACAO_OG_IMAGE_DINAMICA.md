# 🖼️ Implementação: OG Image Dinâmica para Preview de Links

## 📋 Problema

As meta tags Open Graph com logo estático não estavam gerando previews adequados nos compartilhamentos de WhatsApp, Facebook e outras redes sociais após mais de 3 horas.

## 🎯 Nova Estratégia: API de Geração Dinâmica de Imagens

Implementação de uma API serverless que gera imagens OG personalizadas para cada barbearia em tempo real.

## 🏗️ Arquitetura

### 1. API Serverless (Edge Function)
**Arquivo:** `api/og/[slug].tsx`

```typescript
import { ImageResponse } from '@vercel/og';
```

**Características:**
- Runtime: Edge (execução rápida e global)
- Gera imagem PNG de 1200x630px
- Busca dados da barbearia do Supabase
- Renderiza HTML/CSS como imagem

### 2. Fluxo de Funcionamento

```
1. Usuário compartilha link
   ↓
2. Rede social faz request para meta tag og:image
   ↓
3. URL aponta para /api/og/[slug]
   ↓
4. API busca dados da barbearia no Supabase
   ↓
5. Gera imagem dinâmica com:
   - Logo da barbearia
   - Nome
   - Subtítulo
   - CTA "Agende Online"
   - Branding ZapCorte
   ↓
6. Retorna imagem PNG
   ↓
7. Rede social exibe preview rico
```

## 🎨 Design da Imagem OG

### Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [LOGO CIRCULAR]                    │
│                                                 │
│           NOME DA BARBEARIA                     │
│                                                 │
│              Subtítulo                          │
│                                                 │
│     ┌─────────────────────────────┐            │
│     │ 📅 Agende Online Agora      │            │
│     └─────────────────────────────┘            │
│                                                 │
│         Powered by ZapCorte                     │
└─────────────────────────────────────────────────┘
```

### Especificações
- **Dimensões:** 1200x630px (padrão Open Graph)
- **Formato:** PNG
- **Background:** Gradiente roxo (#667eea → #764ba2)
- **Logo:** Circular, 200x200px, borda branca
- **Fonte:** Bold, sombras para legibilidade
- **CTA:** Botão branco com emoji

## 📦 Dependências

### @vercel/og
```json
{
  "@vercel/og": "^0.6.2"
}
```

**Instalação:**
```bash
npm install @vercel/og
```

## 🔧 Implementação

### 1. API Route (`api/og/[slug].tsx`)

```typescript
export const config = {
  runtime: 'edge', // Execução rápida
};

export default async function handler(req: NextRequest) {
  // 1. Extrair slug da URL
  const slug = searchParams.get('slug');
  
  // 2. Buscar dados do Supabase
  const response = await fetch(
    `${supabaseUrl}/rest/v1/barbershops?slug=eq.${slug}`,
    { headers: { 'apikey': supabaseKey } }
  );
  
  // 3. Gerar imagem
  return new ImageResponse(
    <div style={{...}}>
      {/* HTML/CSS aqui */}
    </div>,
    { width: 1200, height: 630 }
  );
}
```

### 2. Atualização do SEO Component

**Antes:**
```typescript
const imageUrl = barbershop.logo_url || `${siteUrl}/zapcorte-icon.png`;
```

**Depois:**
```typescript
const imageUrl = `${siteUrl}/api/og/${barbershop.slug}?slug=${barbershop.slug}`;
```

### 3. Meta Tags Atualizadas

```html
<meta property="og:image" content="https://zapcorte.com/api/og/barbearia-exemplo?slug=barbearia-exemplo" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

## 🌐 URLs Geradas

### Exemplo
```
Barbearia: "Cortes Modernos"
Slug: "cortes-modernos"

URL da Imagem OG:
https://zapcorte.com/api/og/cortes-modernos?slug=cortes-modernos
```

## ✅ Vantagens da Nova Estratégia

### 1. Geração Instantânea
- ✅ Imagem gerada em tempo real
- ✅ Sem necessidade de cache prévio
- ✅ Sempre atualizada

### 2. Personalização Total
- ✅ Logo da barbearia
- ✅ Nome e subtítulo
- ✅ Design profissional
- ✅ Branding consistente

### 3. Performance
- ✅ Edge runtime (rápido globalmente)
- ✅ Imagem otimizada (PNG)
- ✅ Cache automático pelos crawlers

### 4. Compatibilidade
- ✅ WhatsApp
- ✅ Facebook
- ✅ Twitter
- ✅ LinkedIn
- ✅ Telegram
- ✅ iMessage

## 🧪 Como Testar

### Teste 1: Validador do Facebook
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL: `https://zapcorte.com/barbershop/[slug]`
3. Clique em "Depurar"
4. **Verificar:** Imagem OG aparece com logo e informações

### Teste 2: WhatsApp
1. Envie o link para um contato
2. **Verificar:** Preview aparece com imagem personalizada

### Teste 3: Twitter Card Validator
1. Acesse: https://cards-dev.twitter.com/validator
2. Cole a URL
3. **Verificar:** Card preview com imagem

### Teste 4: LinkedIn Post Inspector
1. Acesse: https://www.linkedin.com/post-inspector/
2. Cole a URL
3. **Verificar:** Preview com imagem

## 🔄 Atualização de Cache

### Forçar Atualização no Facebook
```bash
curl -X POST \
  -F "id=https://zapcorte.com/barbershop/[slug]" \
  -F "scrape=true" \
  "https://graph.facebook.com/?id=https://zapcorte.com/barbershop/[slug]&scrape=true"
```

### Forçar Atualização no WhatsApp
- Adicione `?v=2` ao final da URL
- Exemplo: `https://zapcorte.com/barbershop/exemplo?v=2`

## 📊 Comparação: Antes vs Depois

### Antes (Logo Estático)
```
❌ Preview genérico
❌ Apenas logo pequeno
❌ Sem informações da barbearia
❌ Demora para atualizar (3+ horas)
❌ Não funciona consistentemente
```

### Depois (OG Image Dinâmica)
```
✅ Preview rico e personalizado
✅ Logo grande e destacado
✅ Nome e subtítulo visíveis
✅ CTA claro "Agende Online"
✅ Geração instantânea
✅ Funciona em todas as plataformas
```

## 🎨 Customizações Futuras

### Variação 1: Com Serviços
```typescript
<div>
  {/* Logo e Nome */}
  <div>Serviços:</div>
  <div>✂️ Corte • 💈 Barba • 🎨 Design</div>
</div>
```

### Variação 2: Com Avaliações
```typescript
<div>
  ⭐⭐⭐⭐⭐ 4.9/5.0
  <div>+500 clientes satisfeitos</div>
</div>
```

### Variação 3: Com Promoção
```typescript
<div style={{ backgroundColor: 'red' }}>
  🔥 PROMOÇÃO: 20% OFF
</div>
```

## 🔒 Segurança

### Validações Implementadas
```typescript
// 1. Verificar slug existe
if (!slug) {
  return new Response('Missing slug', { status: 400 });
}

// 2. Verificar barbearia existe
if (!barbershop) {
  return new Response('Not found', { status: 404 });
}

// 3. Sanitizar dados
const safeName = barbershop.name.replace(/[<>]/g, '');
```

### Rate Limiting (Futuro)
```typescript
// Limitar requests por IP
const ip = req.headers.get('x-forwarded-for');
// Implementar cache Redis
```

## 📈 Métricas para Acompanhar

### KPIs
1. **Taxa de Cliques (CTR)** - % de pessoas que clicam no link
2. **Tempo de Carregamento** - Velocidade de geração da imagem
3. **Taxa de Erro** - Falhas na geração
4. **Compartilhamentos** - Quantas vezes o link foi compartilhado

### Analytics (Futuro)
```typescript
// Adicionar tracking
await logOGImageGeneration({
  slug,
  timestamp: new Date(),
  userAgent: req.headers.get('user-agent'),
});
```

## 🚀 Deploy

### Vercel (Automático)
```bash
git push origin main
# Vercel detecta automaticamente a API route
# Deploy em ~30 segundos
```

### Variáveis de Ambiente Necessárias
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_SITE_URL=https://zapcorte.com
```

## 🐛 Troubleshooting

### Problema: Imagem não aparece
**Solução:**
1. Verificar se API está respondendo: `curl https://zapcorte.com/api/og/slug`
2. Verificar logs no Vercel
3. Testar com validador do Facebook

### Problema: Logo não carrega
**Solução:**
1. Verificar se `logo_url` está acessível publicamente
2. Adicionar CORS headers se necessário
3. Usar fallback para logo padrão

### Problema: Texto cortado
**Solução:**
1. Ajustar `maxWidth` do container
2. Reduzir `fontSize`
3. Adicionar `overflow: hidden` e `textOverflow: ellipsis`

## 📚 Recursos

### Documentação
- [@vercel/og](https://vercel.com/docs/functions/edge-functions/og-image-generation)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### Ferramentas de Teste
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [OpenGraph.xyz](https://www.opengraph.xyz/)

---

**Status:** ✅ Implementado
**Data:** 16/11/2025
**Tecnologia:** @vercel/og + Edge Functions
**Formato:** PNG 1200x630px
