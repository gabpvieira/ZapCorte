# Instalação do SEO Personalizado

## Passo 1: Instalar Dependência

Execute no terminal:

```bash
npm install react-helmet-async
```

## Passo 2: Configurar Variável de Ambiente

Adicione no arquivo `.env.local`:

```env
VITE_SITE_URL=https://zapcorte.com
```

Para desenvolvimento local:
```env
VITE_SITE_URL=http://localhost:5173
```

## Passo 3: Configurar no Vercel

No painel do Vercel, adicione a variável de ambiente:
- Nome: `VITE_SITE_URL`
- Valor: `https://zapcorte.com`

## Passo 4: Testar

1. Acesse uma página de barbearia: `/barbershop/{slug}`
2. Copie a URL
3. Cole no WhatsApp ou use o Facebook Debugger
4. Verifique se o preview aparece com:
   - Logo da barbearia
   - Nome + "Agende Online | ZapCorte"
   - Descrição personalizada

## Ferramentas de Teste

- **Facebook/WhatsApp**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

## Resultado Esperado

Quando compartilhar o link da barbearia, deve aparecer:
- ✅ Imagem: Logo da barbearia
- ✅ Título: "{Nome} - Agende Online | ZapCorte"
- ✅ Descrição: Subtitle da barbearia
- ✅ URL: Link clicável

## Troubleshooting

### Preview não aparece
1. Limpe o cache do Facebook Debugger
2. Verifique se a logo_url está acessível
3. Confirme que VITE_SITE_URL está configurado

### Imagem não carrega
1. Verifique se a URL da logo é pública
2. Teste a URL diretamente no navegador
3. Certifique-se que não há CORS bloqueando

### Descrição não aparece
1. Verifique se o barbershop tem subtitle
2. Caso não tenha, usa descrição padrão
3. Máximo de 160 caracteres
