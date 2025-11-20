# Sistema de Atualização Automática PWA v2.0

## 🎯 Objetivo

Resolver o problema de tela preta após atualizações do PWA e implementar um sistema robusto de versionamento que:
- Detecta automaticamente novas versões
- Limpa cache corretamente
- Mostra tela de atualização profissional
- Mantém dados de autenticação
- Evita necessidade de desinstalar/reinstalar

## 🏗️ Arquitetura

### 1. Controle de Versão Centralizado

**Arquivo:** `src/config/version.ts`

```typescript
export const APP_VERSION = '2.3.0';
export const CHANGELOG = {
  '2.3.0': ['Novidades...']
};
```

Este é o único lugar onde a versão precisa ser atualizada manualmente.

### 2. Hook de Versionamento

**Arquivo:** `src/hooks/useAppVersion.ts`

Responsável por:
- Detectar mudanças de versão
- Limpar caches antigos
- Preservar dados de autenticação
- Coordenar o processo de atualização

### 3. Tela de Atualização

**Arquivo:** `src/components/UpdateScreen.tsx`

Mostra:
- Logo do ZapCorte
- Versão atual
- Barra de progresso
- Mensagem de status

### 4. Service Worker Atualizado

**Arquivo:** `public/sw.js`

- Versão sincronizada com o app
- Limpeza automática de caches antigos
- Notificação de clientes sobre atualizações

### 5. Cache Buster

**Arquivo:** `public/cache-buster.js`

- Roda antes do React carregar
- Detecta e limpa cache problemático
- Previne erros de variáveis não definidas

## 🔄 Fluxo de Atualização

```
1. Usuário abre PWA
   ↓
2. cache-buster.js verifica versão
   ↓
3. Se versão diferente:
   - Limpa Service Workers
   - Limpa caches
   - Preserva auth
   - Atualiza versão
   ↓
4. useAppVersion detecta mudança
   ↓
5. Mostra UpdateScreen
   ↓
6. Recarrega aplicação
   ↓
7. App carrega com nova versão
```

## 📝 Como Atualizar a Versão

### Método Automático (Recomendado)

```bash
npm run version:update 2.4.0
```

Este comando atualiza automaticamente:
- `src/config/version.ts`
- `public/sw.js`
- `public/cache-buster.js`
- `package.json`

### Método Manual

1. Atualizar `src/config/version.ts`:
```typescript
export const APP_VERSION = '2.4.0';
```

2. Atualizar `public/sw.js`:
```javascript
const CACHE_NAME = 'zapcorte-v2.4';
const CACHE_VERSION = '2.4.0';
```

3. Atualizar `public/cache-buster.js`:
```javascript
const CACHE_VERSION = 'v2.4.0';
```

4. Atualizar `package.json`:
```json
"version": "2.4.0"
```

5. Atualizar CHANGELOG em `src/config/version.ts`

## 🚀 Deploy

Após atualizar a versão:

```bash
# 1. Commit
git add .
git commit -m "chore: bump version to 2.4.0"

# 2. Push
git push

# 3. Vercel faz deploy automático
```

## ✅ Checklist de Atualização

- [ ] Atualizar versão usando script ou manualmente
- [ ] Atualizar CHANGELOG
- [ ] Testar localmente
- [ ] Commit e push
- [ ] Verificar deploy na Vercel
- [ ] Testar PWA em produção
- [ ] Verificar que não há tela preta
- [ ] Confirmar que dados de auth foram preservados

## 🔍 Debugging

### Verificar Versão Atual

No console do navegador:
```javascript
localStorage.getItem('zapcorte_app_version')
```

### Forçar Atualização

No console do navegador:
```javascript
localStorage.removeItem('zapcorte_app_version')
location.reload()
```

### Limpar Tudo

No console do navegador:
```javascript
// Limpar Service Workers
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))

// Limpar Caches
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))

// Limpar Storage
localStorage.clear()
sessionStorage.clear()

// Recarregar
location.reload()
```

## 📊 Logs

O sistema gera logs detalhados no console:

```
[Version] Stored: 2.2.0 Current: 2.3.0
[Version] Nova versão detectada, iniciando atualização...
[Update] Iniciando processo de atualização...
[Update] Service Workers encontrados: 1
[Update] Service Worker removido
[Update] Caches encontrados: 3
[Update] Cache removido: zapcorte-v2.2
[Update] Atualização concluída com sucesso
```

## 🛡️ Proteções

### Dados Preservados
- Token de autenticação Supabase
- Dados do usuário
- Preferências do sistema

### Dados Limpos
- Caches antigos
- Service Workers desatualizados
- Dados temporários
- Session storage

## 🎨 Experiência do Usuário

1. **Primeira Instalação**: Sem tela de atualização
2. **Atualização Detectada**: Tela com logo e progresso
3. **Atualização Concluída**: App recarrega automaticamente
4. **Sem Interrupção**: Usuário permanece logado

## 📱 Compatibilidade

- ✅ iOS Safari (PWA)
- ✅ Android Chrome (PWA)
- ✅ Desktop Chrome
- ✅ Desktop Edge
- ✅ Desktop Safari

## 🔮 Próximas Melhorias

- [ ] Notificação push sobre atualizações disponíveis
- [ ] Opção de adiar atualização
- [ ] Changelog visível no app
- [ ] Rollback automático em caso de erro
- [ ] Métricas de sucesso de atualização

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no console
2. Testar limpeza manual
3. Verificar versão do Service Worker
4. Confirmar que todas as versões estão sincronizadas
