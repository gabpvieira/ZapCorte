# 🧪 Teste Rápido - Sistema de Autenticação

## ⚡ Comandos Rápidos

### Iniciar o projeto
```bash
cd zap-corte-pro-main
npm run dev
```

## 🔗 URLs para Testar

### Desenvolvimento (localhost:5173)
- Login: http://localhost:5173/login
- Registro: http://localhost:5173/register
- Esqueci senha: http://localhost:5173/forgot-password
- Confirmar email: http://localhost:5173/auth/confirm
- Redefinir senha: http://localhost:5173/auth/reset-password

## 📋 Checklist de Testes

### ✅ Teste 1: Confirmação de Email

1. [ ] Acesse `/register` e crie uma conta
2. [ ] Verifique seu email
3. [ ] Clique no link de confirmação
4. [ ] Verifique se foi redirecionado para `/login?confirmed=true`
5. [ ] Verifique se apareceu o toast "Email confirmado!"
6. [ ] Faça login com a conta criada

### ✅ Teste 2: Redefinição de Senha

1. [ ] Acesse `/login`
2. [ ] Clique em "Esqueceu a senha?"
3. [ ] Digite seu email
4. [ ] Clique em "Enviar Link de Redefinição"
5. [ ] Verifique se apareceu a tela de confirmação
6. [ ] Verifique seu email
7. [ ] Clique no link de redefinição
8. [ ] Verifique se foi redirecionado para `/auth/reset-password`
9. [ ] Digite uma nova senha (mínimo 6 caracteres)
10. [ ] Confirme a senha
11. [ ] Verifique os indicadores visuais:
    - [ ] ✅ "Senha válida" (verde)
    - [ ] ✅ "Senhas coincidem" (verde)
12. [ ] Clique em "Redefinir Senha"
13. [ ] Verifique se foi redirecionado para `/login?reset=success`
14. [ ] Verifique se apareceu o toast "Senha redefinida!"
15. [ ] Faça login com a nova senha

### ✅ Teste 3: Validações

1. [ ] Tente redefinir senha com menos de 6 caracteres
   - Deve mostrar: "Senha muito curta"
2. [ ] Tente redefinir com senhas diferentes
   - Deve mostrar: "Senhas não coincidem"
3. [ ] Tente acessar `/auth/reset-password` sem token
   - Deve redirecionar para login com erro

### ✅ Teste 4: Fluxo Completo

1. [ ] Registre novo usuário
2. [ ] Confirme email
3. [ ] Faça login
4. [ ] Faça logout
5. [ ] Clique em "Esqueceu a senha?"
6. [ ] Redefina a senha
7. [ ] Faça login com nova senha
8. [ ] Acesse o dashboard

## 🎨 Elementos Visuais para Verificar

### Página de Login
- [ ] Logo do ZapCorte
- [ ] Link "Esqueceu a senha?"
- [ ] Toast de confirmação (se `?confirmed=true`)
- [ ] Toast de senha redefinida (se `?reset=success`)

### Página Esqueci Senha
- [ ] Logo do ZapCorte
- [ ] Ícone de email
- [ ] Botão "Voltar para o login"
- [ ] Tela de confirmação após envio

### Página Redefinir Senha
- [ ] Logo do ZapCorte
- [ ] Ícone de cadeado
- [ ] Campos de senha com toggle de visibilidade
- [ ] Indicadores de validação:
  - Senha válida (verde) / Mínimo 6 caracteres (amarelo)
  - Senhas coincidem (verde) / Senhas não coincidem (vermelho)
- [ ] Botão desabilitado se validações não passarem

### Página de Confirmação
- [ ] Logo do ZapCorte
- [ ] Spinner de loading
- [ ] Ícone de sucesso (verde) ou erro (vermelho)
- [ ] Mensagem apropriada
- [ ] Logs de debug (apenas em dev)

## 🐛 Problemas Comuns

### Email não chega
1. Verifique a pasta de spam
2. Verifique se o email está correto no Supabase
3. Verifique os logs do Supabase em Authentication → Logs

### Token inválido
1. Tokens expiram após 1 hora (padrão Supabase)
2. Solicite um novo email
3. Use o link imediatamente após receber

### Redirecionamento não funciona
1. Verifique se as URLs estão configuradas no Supabase
2. Verifique se a Site URL está correta
3. Limpe o cache do navegador

## 📊 Logs de Debug

Em desenvolvimento, você pode ver logs detalhados:

1. Abra o Console do navegador (F12)
2. Procure por logs com prefixo `[AuthConfirm]`
3. Verifique os métodos de validação tentados
4. Na página de confirmação, clique em "Ver logs de debug"

## 🔧 Configuração do Supabase

### URLs que devem estar configuradas:

**Site URL:**
- Dev: `http://localhost:5173`
- Prod: `https://seu-dominio.com`

**Redirect URLs:**
- `http://localhost:5173/auth/confirm`
- `http://localhost:5173/auth/reset-password`
- `https://seu-dominio.com/auth/confirm`
- `https://seu-dominio.com/auth/reset-password`

### Templates de Email:

**Confirm Signup:**
```
{{ .SiteURL }}/auth/confirm?token={{ .Token }}
```

**Reset Password:**
```
{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=recovery
```

## ✨ Funcionalidades Implementadas

- [x] Confirmação de email com múltiplos métodos de validação
- [x] Redefinição de senha com validação robusta
- [x] Feedback visual com toasts
- [x] Indicadores de força da senha
- [x] Validação de senhas coincidentes
- [x] Tratamento de erros amigável
- [x] Loading states em todas as operações
- [x] Logs de debug em desenvolvimento
- [x] Responsivo e acessível
- [x] Animações suaves com Framer Motion

## 🎯 Próximos Passos

Após testar localmente:

1. [ ] Fazer deploy da aplicação
2. [ ] Atualizar Site URL no Supabase para produção
3. [ ] Adicionar URLs de redirect de produção
4. [ ] Testar todos os fluxos em produção
5. [ ] Configurar domínio personalizado para emails (opcional)

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console
2. Verifique os logs do Supabase
3. Consulte a documentação completa em `CONFIGURACAO_AUTH_SUPABASE.md`
4. Verifique se todas as variáveis de ambiente estão configuradas
