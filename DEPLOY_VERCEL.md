# 🚀 Guia de Deploy no Vercel - ZapCorte

## ✅ Correções Aplicadas

### 1. **Rotas Públicas e Privadas**
- ✅ Rotas públicas (/, /login, /register, /barbershop, /booking, /my-appointments) agora são acessíveis sem autenticação
- ✅ Rotas do dashboard (/dashboard/*) são protegidas e redirecionam para /login se não autenticado
- ✅ Componente `ProtectedRoute` criado para proteger rotas privadas

### 2. **Configuração do Vercel**
- ✅ `vercel.json` configurado corretamente com rewrites para SPA (Single Page Application)
- ✅ A Vercel detecta automaticamente projetos Vite e configura o build

### 3. **Variáveis de Ambiente**
- ✅ Tratamento de erro melhorado para variáveis de ambiente faltando
- ✅ Validação das variáveis obrigatórias do Supabase

## 📋 Variáveis de Ambiente Obrigatórias no Vercel

### Configuração no Painel da Vercel:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

#### Obrigatórias:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

#### Opcionais (mas recomendadas):
```
VITE_ONESIGNAL_APP_ID=seu_app_id_onesignal
VITE_ONESIGNAL_REST_API_KEY=sua_chave_rest_api_onesignal
VITE_ONESIGNAL_CLICK_URL=https://seu-dominio.com/painel
VITE_ONESIGNAL_ICON_URL=https://seu-dominio.com/logo.png
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/seu_id_starter
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/seu_id_pro
```

## 🔧 Passos para Deploy

### 1. Verificar Configurações
- ✅ Certifique-se de que todas as variáveis de ambiente estão configuradas no Vercel
- ✅ Verifique se o repositório está conectado ao GitHub
- ✅ Certifique-se de que o branch `main` está selecionado para deploy

### 2. Deploy Automático
- A Vercel fará deploy automaticamente a cada push no branch `main`
- O build será executado automaticamente com `npm run build`
- Os arquivos serão servidos da pasta `dist`

### 3. Verificar Deploy
- Acesse a URL fornecida pela Vercel
- Verifique se a página inicial carrega corretamente
- Teste as rotas públicas (/, /login, /register)
- Teste as rotas privadas (faça login primeiro)

## 🐛 Troubleshooting

### Problema: Página em branco após deploy
**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas no Vercel
2. Verifique os logs de build no painel da Vercel
3. Verifique se há erros no console do navegador

### Problema: Erro 404 ao acessar rotas
**Solução:**
- Verifique se o `vercel.json` está configurado corretamente com os rewrites
- Certifique-se de que todas as rotas estão sendo redirecionadas para `/index.html`

### Problema: Erro de autenticação
**Solução:**
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
2. Verifique se as URLs de redirecionamento estão configuradas no Supabase
3. Adicione a URL do Vercel nas URLs permitidas no Supabase (Authentication → URL Configuration)

### Problema: Build falha
**Solução:**
1. Verifique os logs de build no Vercel
2. Teste o build localmente com `npm run build`
3. Verifique se todas as dependências estão no `package.json`

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Repositório conectado ao GitHub
- [ ] Branch `main` selecionado para deploy
- [ ] Build local funcionando (`npm run build`)
- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] Testes das rotas públicas
- [ ] Testes das rotas privadas (com login)
- [ ] Verificação de console do navegador (sem erros)

## 🔗 Links Úteis

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do React Router](https://reactrouter.com/)

## 📞 Suporte

Se encontrar problemas durante o deploy:
1. Verifique os logs de build no Vercel
2. Verifique o console do navegador
3. Verifique as variáveis de ambiente
4. Teste o build localmente primeiro

