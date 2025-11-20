# Sistema de Atualização Robusto PWA

## 🎯 Objetivo

Eliminar completamente o problema de tela preta após atualizações do PWA através de um sistema que:
- Detecta atualizações ANTES do React carregar
- Mostra splash screen profissional durante atualização
- Limpa caches de forma segura e progressiva
- Preserva dados de autenticação
- Previne loops de atualização
- Garante que o app sempre abre na versão correta

## 🏗️ Arquitetura

### 1. Update Manager (update-manager.js)

**Carrega PRIMEIRO**, antes de qualquer outro script.

**Responsabilidades:**
- Verificar versão armazenada vs versão atual
- Detectar se atualização é necessária
- Mostrar splash screen animado
- Limpar Service Workers, caches e storage
- Preservar dados de autenticação
- Prevenir loops de atualização
- Recarregar app após atualização

**Proteções:**
- `UPDATE_IN_PROGRESS_KEY`: Previne loops de atualização
- `LAST_CHECK_KEY`: Evita verificações muito frequentes (mínimo 5s)
- Timeout de segurança em cada etapa
- Tratamento de erros com fallback

### 2. Splash Screen de Atualização

**Visual:**
- Logo do ZapCorte
- Título "Atualizando ZapCorte"
- Versão atual
- Barra de progresso animada
- Mensagem de status

**Etapas do Progresso:**
1. 20% - Removendo versões antigas (Service Workers)
2. 40% - Limpando cache
3. 60% - Atualizando configurações (localStorage)
4. 80% - Finalizando (sessionStorage)
5. 100% - Concluído!

### 3. Fluxo de Atualização

```
1. Usuário abre PWA
   ↓
2. update-manager.js carrega PRIMEIRO
   ↓
3. Verifica versão armazenada
   ↓
4. Se diferente:
   - Mostra splash screen
   - Remove Service Workers (20%)
   - Limpa caches (40%)
   - Limpa localStorage seletivo (60%)
   - Limpa sessionStorage (80%)
   - Atualiza versão (100%)
   - Recarrega página
   ↓
5. Segunda carga:
   - Versão correta detectada
   - Pula atualização
   - App carrega normalmente
   ↓
6. React carrega com versão atualizada
```

## 📝 Versionamento

### Arquivo Único de Versão

**Localização:** `src/config/version.ts`

```typescript
export const APP_VERSION = '2.3.0';
```

### Sincronização Automática

Ao atualizar a versão, também atualizar em:
- `public/update-manager.js` (linha 9)
- `public/sw.js` (linha 4)
- `public/cache-buster.js` (linha 9)
- `package.json` (campo version)

**Comando automático:**
```bash
npm run version:update 2.4.0
```

## 🔒 Dados Preservados

Durante a atualização, os seguintes dados são **PRESERVADOS**:

- ✅ Token de autenticação Supabase (`supabase.auth.token`)
- ✅ Dados de sessão Supabase (prefixo `sb-`)
- ✅ Versão do app (`zapcorte_version`)
- ✅ Timestamp de verificação (`zapcorte_last_check`)

Todos os outros dados são limpos para garantir atualização completa.

## 🛡️ Proteções Contra Loops

### 1. Flag de Atualização em Progresso
```javascript
sessionStorage.setItem(UPDATE_IN_PROGRESS_KEY, 'true');
```
Previne que a mesma atualização rode múltiplas vezes.

### 2. Intervalo Mínimo de Verificação
```javascript
const minCheckInterval = 5000; // 5 segundos
```
Evita verificações muito frequentes que podem causar loops.

### 3. Timestamp de Última Verificação
```javascript
localStorage.setItem(LAST_CHECK_KEY, now.toString());
```
Rastreia quando foi a última verificação.

## 🎨 Experiência do Usuário

### Primeira Instalação
- Sem splash de atualização
- App carrega diretamente
- Versão é registrada

### Atualização Detectada
1. Splash screen aparece instantaneamente
2. Barra de progresso avança suavemente
3. Mensagens de status informativas
4. Duração total: ~2 segundos
5. Recarregamento automático
6. App abre na nova versão

### Sem Atualização
- Verificação silenciosa
- App carrega normalmente
- Zero impacto na performance

## 🔍 Debugging

### Verificar Versão Atual
```javascript
localStorage.getItem('zapcorte_version')
```

### Forçar Atualização
```javascript
localStorage.removeItem('zapcorte_version')
location.reload()
```

### Verificar Última Verificação
```javascript
const lastCheck = localStorage.getItem('zapcorte_last_check')
console.log(new Date(parseInt(lastCheck)))
```

### Limpar Tudo Manualmente
```javascript
// Service Workers
navigator.serviceWorker.getRegistrations().then(r => 
  r.forEach(reg => reg.unregister())
)

// Caches
caches.keys().then(keys => 
  keys.forEach(key => caches.delete(key))
)

// Storage
localStorage.clear()
sessionStorage.clear()

// Recarregar
location.reload()
```

## 📊 Logs

O sistema gera logs detalhados no console:

```
[Update Manager] Iniciando verificação...
[Update Manager] Versão armazenada: 2.2.0
[Update Manager] Versão atual: 2.3.0
[Update Manager] Nova versão detectada, iniciando atualização...
[Update Manager] Iniciando atualização...
[Update Manager] Atualização concluída, recarregando...
```

## ⚡ Performance

- **Verificação:** < 10ms
- **Atualização completa:** ~2 segundos
- **Sem atualização:** 0ms (verificação instantânea)
- **Impacto no carregamento:** Mínimo

## 🚀 Deploy

### Checklist de Atualização

1. Atualizar versão em `src/config/version.ts`
2. Executar `npm run version:update X.Y.Z`
3. Verificar que todos os arquivos foram atualizados
4. Commit e push
5. Vercel faz deploy automático
6. Usuários recebem atualização na próxima abertura

### Teste Local

```bash
# 1. Mudar versão
npm run version:update 2.4.0

# 2. Build
npm run build

# 3. Preview
npm run preview

# 4. Abrir em modo PWA
# 5. Verificar splash de atualização
```

## 🔮 Melhorias Futuras

- [ ] Notificação push sobre atualizações disponíveis
- [ ] Opção de adiar atualização
- [ ] Changelog visível no splash
- [ ] Rollback automático em caso de erro crítico
- [ ] Métricas de sucesso de atualização
- [ ] A/B testing de estratégias de atualização

## 📞 Troubleshooting

### Problema: Tela preta após atualização
**Solução:** O update-manager deve prevenir isso. Se ocorrer:
1. Verificar se update-manager.js está carregando primeiro
2. Verificar logs no console
3. Limpar manualmente e recarregar

### Problema: Loop de atualização
**Solução:** 
1. Verificar `UPDATE_IN_PROGRESS_KEY` no sessionStorage
2. Verificar `LAST_CHECK_KEY` no localStorage
3. Aumentar `minCheckInterval` se necessário

### Problema: Dados de auth perdidos
**Solução:**
1. Verificar se prefixos `supabase.auth.token` e `sb-` estão em `keysToPreserve`
2. Verificar logs de limpeza do localStorage

## ✅ Garantias

Este sistema garante:
- ✅ Zero telas pretas após atualização
- ✅ Dados de autenticação sempre preservados
- ✅ Atualização suave e progressiva
- ✅ Feedback visual durante atualização
- ✅ Proteção contra loops
- ✅ Fallback em caso de erro
- ✅ Performance otimizada
