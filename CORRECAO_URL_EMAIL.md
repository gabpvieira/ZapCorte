# 🔧 Correção: URL do Email de Confirmação

## ❌ Problema Identificado

O email de confirmação está chegando com URL de localhost:
```
https://ihwkbflhxvdsewifofdk.supabase.co/auth/v1/verify?token=...&redirect_to=http://localhost:5173/auth/confirm
```

## ✅ Solução Implementada

Adicionada configuração para controlar as URLs usadas nos emails.

---

## 🎯 Opções de Configuração

### Opção 1: Usar Produção Automaticamente (Recomendado)

**Quando usar:** Após fazer deploy em produção

**Como funciona:**
- Cadastros feitos em `https://zapcorte.com.br` → URLs de produção
- Cadastros feitos em `localhost` → URLs de localhost

**Não precisa fazer nada!** Funciona automaticamente.

---

### Opção 2: Forçar URLs de Produção no Localhost

**Quando usar:** Para testar emails antes do deploy

**Como configurar:**

1. Abrir arquivo: `src/lib/auth-config.ts`

2. Mudar a constante:
```typescript
// Mude de false para true
const FORCE_PRODUCTION_URLS = true;
```

3. Salvar e reiniciar o servidor:
```bash
# Parar o servidor (Ctrl+C)
npm run dev
```

4. Fazer novo cadastro no localhost

5. O email chegará com URL de produção:
```
redirect_to=https://zapcorte.com.br/auth/confirm ✅
```

**⚠️ IMPORTANTE:** Lembre-se de voltar para `false` antes do deploy!

---

## 📋 Fluxo Correto

### Em Desenvolvimento (localhost)

```
FORCE_PRODUCTION_URLS = false (padrão)
  ↓
Cadastro em: http://localhost:5173/register
  ↓
Email com: redirect_to=http://localhost:5173/auth/confirm
  ↓
Funciona no localhost ✅
```

### Em Produção (zapcorte.com.br)

```
Deploy em produção
  ↓
Cadastro em: https://zapcorte.com.br/register
  ↓
Email com: redirect_to=https://zapcorte.com.br/auth/confirm
  ↓
Funciona em produção ✅
```

### Testando Produção no Localhost

```
FORCE_PRODUCTION_URLS = true
  ↓
Cadastro em: http://localhost:5173/register
  ↓
Email com: redirect_to=https://zapcorte.com.br/auth/confirm
  ↓
Clica no link → vai para produção
  ↓
Funciona se o site já estiver no ar ✅
```

---

## 🚀 Recomendação para Deploy

### Passo a Passo:

1. **Manter configuração padrão**
   ```typescript
   const FORCE_PRODUCTION_URLS = false;
   ```

2. **Fazer deploy para produção**
   ```bash
   git push origin main
   # Deploy automático no Vercel/Netlify
   ```

3. **Testar cadastro em produção**
   - Acessar: `https://zapcorte.com.br/register`
   - Fazer cadastro com email real
   - Verificar email
   - Clicar no link
   - Deve redirecionar para: `https://zapcorte.com.br/dashboard`

4. **Verificar URL no email**
   - Deve conter: `redirect_to=https://zapcorte.com.br/auth/confirm`

---

## 🔍 Como Verificar a URL Atual

### No Código:

```typescript
import { getBaseUrl, isProductionMode } from '@/lib/auth-config';

console.log('Base URL:', getBaseUrl());
console.log('Modo Produção:', isProductionMode());
```

### No Console do Navegador (F12):

```javascript
// Verificar hostname
console.log(window.location.hostname);

// Verificar URL completa
console.log(window.location.origin);
```

---

## 📊 Tabela de Referência

| Ambiente | Hostname | FORCE_PRODUCTION_URLS | URL no Email |
|----------|----------|----------------------|--------------|
| Localhost | `localhost` | `false` | `http://localhost:5173/auth/confirm` |
| Localhost | `localhost` | `true` | `https://zapcorte.com.br/auth/confirm` |
| Produção | `zapcorte.com.br` | `false` | `https://zapcorte.com.br/auth/confirm` |
| Produção | `zapcorte.com.br` | `true` | `https://zapcorte.com.br/auth/confirm` |

---

## 🐛 Troubleshooting

### Problema: Email ainda vem com localhost

**Causa:** Você fez o cadastro antes da atualização

**Solução:**
1. Deletar o usuário no Supabase Dashboard
2. Limpar localStorage do navegador (F12 → Application → Local Storage → Clear)
3. Fazer novo cadastro

### Problema: Link do email não funciona

**Causa:** Site ainda não está no ar em produção

**Solução:**
1. Fazer deploy primeiro
2. Verificar se `https://zapcorte.com.br` está acessível
3. Depois fazer cadastro

### Problema: Esqueci de voltar FORCE_PRODUCTION_URLS para false

**Causa:** Deploy com configuração de teste

**Solução:**
1. Editar `src/lib/auth-config.ts`
2. Mudar para `false`
3. Commit e push
4. Deploy automático

---

## ✅ Checklist Final

Antes do deploy em produção:

- [ ] `FORCE_PRODUCTION_URLS = false` no código
- [ ] Commit e push para GitHub
- [ ] Deploy no Vercel/Netlify
- [ ] Domínio `zapcorte.com.br` configurado
- [ ] Site acessível em `https://zapcorte.com.br`
- [ ] Testar cadastro em produção
- [ ] Verificar URL no email recebido
- [ ] Confirmar que redirecionamento funciona

---

## 📝 Resumo

**Configuração Atual:**
```typescript
const FORCE_PRODUCTION_URLS = false; // ← Padrão (recomendado)
```

**Comportamento:**
- ✅ Localhost → URLs de localhost
- ✅ Produção → URLs de produção
- ✅ Detecção automática

**Para testar antes do deploy:**
- Mudar para `true` temporariamente
- Fazer cadastro
- Verificar email
- **Lembrar de voltar para `false`**

---

**Status:** ✅ Configurado e Pronto  
**Última atualização:** 2025-11-13
