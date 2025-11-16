# Explicação: Aviso do Facebook sobre og:image

## ⚠️ Aviso Recebido

```
Propriedade inferida
As propriedades "og:image" fornecidas ainda não estão disponíveis porque 
as novas imagens são processadas de forma assíncrona. Para garantir que 
os compartilhamentos de novas URLs incluam uma imagem, especifique as 
dimensões usando as tags "og:image:width" e "og:image:height".
```

## ✅ Situação Atual

**As dimensões JÁ ESTÃO especificadas corretamente:**

```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

## 🔍 Por que o aviso aparece?

Este aviso é **NORMAL** e aparece porque:

1. **URL Nova**: É a primeira vez que o Facebook está vendo esta URL
2. **Processamento Assíncrono**: O Facebook processa imagens em background
3. **Cache**: O Facebook ainda não tem a imagem em cache

## ⏱️ O que fazer?

### 1. Aguarde alguns minutos
O Facebook está processando a imagem em background. Isso pode levar de 2 a 10 minutos.

### 2. Force o Scrape novamente
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL da barbearia
3. Clique em **"Scrape Again"** várias vezes
4. Aguarde 1-2 minutos entre cada tentativa

### 3. Verifique se a imagem carregou
Após alguns minutos, o preview deve aparecer corretamente com:
- ✅ Título da barbearia
- ✅ Descrição
- ✅ Logo da barbearia

## 📊 Status das Meta Tags

### ✅ Implementado Corretamente

```html
<!-- Dimensões especificadas -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Tipo da imagem -->
<meta property="og:image:type" content="image/png" />

<!-- URL segura -->
<meta property="og:image:secure_url" content="https://..." />

<!-- Texto alternativo -->
<meta property="og:image:alt" content="Logo {Nome}" />
```

## 🎯 Dimensões Recomendadas

### Para Facebook/WhatsApp
- **Tamanho**: 1200x630px (proporção 1.91:1)
- **Formato**: PNG ou JPG
- **Peso**: Máximo 5MB
- **Mínimo**: 600x315px

### Para Twitter
- **Tamanho**: 1200x675px (proporção 16:9)
- **Formato**: PNG ou JPG
- **Peso**: Máximo 5MB

### Para LinkedIn
- **Tamanho**: 1200x627px
- **Formato**: PNG ou JPG
- **Peso**: Máximo 5MB

## 🔧 Troubleshooting

### Se o preview não aparecer após 10 minutos:

1. **Verifique a URL da imagem:**
   ```bash
   # Teste se a imagem está acessível
   curl -I https://zapcorte.com/zapcorte-icon.png
   ```

2. **Verifique o formato:**
   - Deve ser PNG ou JPG
   - Não pode ser SVG
   - Não pode ser WebP (não suportado pelo Facebook)

3. **Verifique o tamanho:**
   - Mínimo: 200x200px
   - Recomendado: 1200x630px
   - Máximo: 8MB

4. **Verifique HTTPS:**
   - A URL deve começar com `https://`
   - Não pode ser `http://`

5. **Verifique CORS:**
   - A imagem deve ser acessível publicamente
   - Não pode ter restrições de CORS

## ✨ Resultado Esperado

Após o processamento, o preview deve aparecer assim:

```
┌─────────────────────────────────┐
│                                 │
│    [Logo da Barbearia]          │
│         1200x630px              │
│                                 │
│  Barbearia do João              │
│  Agende Online | ZapCorte       │
│                                 │
│  Cortes modernos e barba        │
│  profissional. Agende online!   │
│                                 │
│  zapcorte.com                   │
│                                 │
└─────────────────────────────────┘
```

## 📝 Conclusão

O aviso do Facebook é **NORMAL** e **ESPERADO** para URLs novas. As meta tags estão configuradas corretamente. Basta aguardar alguns minutos para o Facebook processar a imagem.

**Não é necessário fazer nenhuma alteração no código!** ✅
