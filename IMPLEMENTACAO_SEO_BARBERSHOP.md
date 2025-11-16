# Implementação de SEO Personalizado para Barbearias

## Objetivo
Criar previews ricos e personalizados quando o link da barbearia for compartilhado no WhatsApp, Facebook, Twitter e outras redes sociais.

## O que foi implementado

### 1. Componente BarbershopSEO
Criado em `src/components/BarbershopSEO.tsx`

**Funcionalidades:**
- Meta tags Open Graph (Facebook, WhatsApp)
- Twitter Cards
- Schema.org para Google
- Meta tags básicas de SEO

**Dados Personalizados:**
- Título: `{Nome da Barbearia} - Agende Online | ZapCorte`
- Descrição: Usa o subtitle da barbearia ou descrição padrão
- Imagem: Logo da barbearia (fallback para logo do ZapCorte)
- URL: Link único da barbearia

### 2. Meta Tags Implementadas

#### Open Graph (Facebook/WhatsApp)
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="{Nome} - Agende Online | ZapCorte" />
<meta property="og:description" content="{Descrição personalizada}" />
<meta property="og:image" content="{Logo da barbearia}" />
<meta property="og:url" content="https://zapcorte.com/barbershop/{slug}" />
```

#### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{Nome} - Agende Online | ZapCorte" />
<meta name="twitter:description" content="{Descrição}" />
<meta name="twitter:image" content="{Logo}" />
```

#### Schema.org (Google)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{Nome da Barbearia}",
  "description": "{Descrição}",
  "image": "{Logo}",
  "telephone": "{WhatsApp}",
  "openingHoursSpecification": [...]
}
```

### 3. Preview do Link

Quando compartilhado, o link mostrará:
- **Imagem**: Logo da barbearia
- **Título**: Nome da barbearia + "Agende Online | ZapCorte"
- **Descrição**: Subtitle personalizado da barbearia
- **URL**: Link direto para agendamento

## Como funciona

1. Quando alguém acessa `/barbershop/{slug}`, o componente carrega os dados da barbearia
2. O `BarbershopSEO` gera as meta tags dinamicamente com os dados da barbearia
3. Quando o link é compartilhado, as redes sociais leem essas meta tags
4. O preview mostra a logo, nome e descrição personalizados

## Instalação

```bash
npm install react-helmet-async
```

## Configuração no Vercel

Adicione a variável de ambiente:
```
VITE_SITE_URL=https://zapcorte.com
```

## Testando os Previews

### Facebook/WhatsApp
https://developers.facebook.com/tools/debug/

### Twitter
https://cards-dev.twitter.com/validator

### LinkedIn
https://www.linkedin.com/post-inspector/

## Otimizações Recomendadas

### 1. Imagem de Preview Otimizada
- Tamanho recomendado: 1200x630px
- Formato: PNG ou JPG
- Peso máximo: 5MB

### 2. Logo da Barbearia
- Deve ser quadrada (1:1)
- Mínimo: 400x400px
- Recomendado: 800x800px

### 3. Descrição
- Máximo: 160 caracteres
- Deve ser atrativa e clara
- Incluir call-to-action

## Exemplo de Preview

**WhatsApp:**
```
┌─────────────────────────────┐
│  [Logo da Barbearia]        │
│                             │
│  Barbearia do João          │
│  Agende Online | ZapCorte   │
│                             │
│  Cortes modernos e barba    │
│  profissional. Agende seu   │
│  horário online!            │
│                             │
│  zapcorte.com               │
└─────────────────────────────┘
```

## Benefícios

✅ **Profissionalismo**: Preview rico e personalizado
✅ **Conversão**: Mais cliques no link
✅ **Branding**: Logo e nome da barbearia em destaque
✅ **SEO**: Melhor ranqueamento no Google
✅ **Confiança**: Aparência profissional aumenta credibilidade

## Próximos Passos

1. Testar previews em todas as redes sociais
2. Otimizar imagens das barbearias
3. Adicionar mais dados estruturados (avaliações, preços)
4. Implementar cache de meta tags
