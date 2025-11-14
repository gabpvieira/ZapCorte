# 🚀 Deploy PWA Completo - ZapCorte

## ✅ Checklist Pré-Deploy

### 1. Gerar Ícones
```bash
cd zap-corte-pro-main
npm install sharp --save-dev
npm run generate-icons
```

**Verificar**: Todos os ícones devem estar em `/public`:
- ✅ icon-48.png até icon-512.png
- ✅ icon-192-maskable.png e icon-512-maskable.png
- ✅ favicon-16x16.png e favicon-32x32.png
- ✅ apple-touch-icon.png
- ✅ android-chrome-192x192.png e android-chrome-512x512.png

### 2. Verificar Arquivos PWA
```bash
# Verificar se os arquivos existem
ls public/sw.js
ls public/offline.html
ls public/manifest.json
ls src/lib/serviceWorker.ts
ls src/components/PWAInstallPrompt.tsx
```

### 3. Build Local
```bash
npm run build
npm run preview
```

Abrir `http://localhost:4173` e testar:
- [ ] App carrega corretamente
- [ ] Service Worker registra (DevTools → Application)
- [ ] Ícones aparecem no manifest
- [ ] Prompt de instalação aparece (após 30s)

### 4. Teste Lighthouse
```bash
# Com o preview rodando
# Abrir Chrome DevTools → Lighthouse
# Selecionar "Progressive Web App"
# Clicar em "Analyze page load"
```

**Score esperado**: 100/100 ✅

---

## 📦 Deploy para Vercel

### Opção 1: Via Git (Recomendado)

```bash
# 1. Commit das alterações
git add .
git commit -m "feat: implementar PWA completo com service worker e ícones corretos"

# 2. Push para o repositório
git push origin main

# 3. Vercel fará deploy automático
```

### Opção 2: Via Vercel CLI

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

---

## ⚙️ Configurações Vercel

### Headers para PWA

Adicionar em `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

### Variáveis de Ambiente

Verificar se estão configuradas no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` (https://zapcorte.com.br)

---

## 🧪 Testes Pós-Deploy

### 1. Verificar Service Worker

```javascript
// Abrir DevTools → Console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg ? 'Registrado' : 'Não registrado');
  console.log('Scope:', reg?.scope);
  console.log('Active:', reg?.active ? 'Sim' : 'Não');
});
```

### 2. Verificar Manifest

```javascript
// Abrir DevTools → Console
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => {
    console.log('Manifest:', manifest);
    console.log('ID:', manifest.id);
    console.log('Ícones:', manifest.icons.length);
  });
```

### 3. Testar Instalação

**Android (Chrome)**:
1. Abrir https://zapcorte.com.br
2. Menu (⋮) → "Instalar app"
3. Confirmar instalação
4. Verificar ícone na tela inicial

**iOS (Safari)**:
1. Abrir https://zapcorte.com.br
2. Botão compartilhar
3. "Adicionar à Tela de Início"
4. Confirmar

**Desktop (Chrome/Edge)**:
1. Abrir https://zapcorte.com.br
2. Ícone de instalação na barra de endereço
3. Confirmar instalação
4. App abre em janela separada

### 4. Testar Offline

```bash
# DevTools → Network → Offline
# Recarregar página
# Deve mostrar conteúdo em cache ou página offline
```

### 5. Testar Notificações

```javascript
// DevTools → Console
Notification.requestPermission().then(permission => {
  console.log('Permissão:', permission);
  if (permission === 'granted') {
    new Notification('Teste', {
      body: 'Notificação funcionando!',
      icon: '/icon-192.png'
    });
  }
});
```

---

## 📊 Validação Lighthouse

### Executar Lighthouse

```bash
# Opção 1: Chrome DevTools
# F12 → Lighthouse → Progressive Web App → Analyze

# Opção 2: CLI
npm install -g lighthouse
lighthouse https://zapcorte.com.br --view
```

### Checklist PWA (100/100)

- [x] Registra um service worker
- [x] Responde com 200 quando offline
- [x] start_url carrega offline
- [x] Possui manifest.json válido
- [x] Ícones em múltiplos tamanhos (48-512px)
- [x] Ícones maskable para Android
- [x] ID único no manifest
- [x] Tema de cor configurado
- [x] Viewport configurado
- [x] HTTPS habilitado
- [x] Redireciona HTTP para HTTPS
- [x] Splash screen configurada
- [x] Atalhos (shortcuts) funcionando

---

## 🔍 Troubleshooting

### Service Worker não registra

**Sintoma**: Console mostra erro ao registrar SW

**Diagnóstico**:
```javascript
// DevTools → Console
console.log('SW suportado?', 'serviceWorker' in navigator);
console.log('HTTPS?', location.protocol === 'https:');
```

**Solução**:
1. Verificar se está em HTTPS
2. Limpar cache: DevTools → Application → Clear storage
3. Hard refresh: Ctrl+Shift+R
4. Verificar se `/sw.js` existe e é acessível

### Ícones não aparecem

**Sintoma**: Ícones quebrados ou tamanho errado

**Diagnóstico**:
```bash
# Verificar se ícones existem
curl -I https://zapcorte.com.br/icon-192.png
curl -I https://zapcorte.com.br/icon-512.png
```

**Solução**:
1. Executar `npm run generate-icons` novamente
2. Verificar se ícones foram commitados
3. Fazer novo deploy
4. Limpar cache do navegador

### App não funciona offline

**Sintoma**: Página em branco quando offline

**Diagnóstico**:
```javascript
// DevTools → Application → Service Workers
// Verificar status: "activated and running"

// DevTools → Application → Cache Storage
// Verificar se há recursos em cache
```

**Solução**:
1. Verificar se SW está ativo
2. Recarregar página com internet
3. Aguardar cache ser populado
4. Testar offline novamente

### Prompt de instalação não aparece

**Sintoma**: Não mostra opção de instalar

**Diagnóstico**:
```javascript
// DevTools → Console
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Prompt disponível!', e);
});
```

**Solução**:
1. Verificar se já está instalado
2. Verificar se manifest.json é válido
3. Verificar se todos os critérios PWA são atendidos
4. Aguardar 30 segundos (delay intencional)

---

## 📈 Monitoramento

### Métricas para Acompanhar

1. **Taxa de Instalação**
   - Quantos usuários instalam o PWA
   - Meta: >20% dos visitantes

2. **Uso Offline**
   - Quantas requisições são servidas do cache
   - Meta: >50% de cache hit rate

3. **Engajamento**
   - Tempo de uso do app instalado vs web
   - Meta: 2x mais tempo no app instalado

4. **Notificações**
   - Taxa de opt-in para notificações
   - Meta: >30% dos usuários

### Ferramentas de Monitoramento

```javascript
// Google Analytics - Rastrear instalação
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed', {
    event_category: 'PWA',
    event_label: 'App Installed'
  });
});

// Rastrear uso offline
window.addEventListener('online', () => {
  gtag('event', 'back_online', {
    event_category: 'PWA',
    event_label: 'Connection Restored'
  });
});

window.addEventListener('offline', () => {
  gtag('event', 'went_offline', {
    event_category: 'PWA',
    event_label: 'Connection Lost'
  });
});
```

---

## 🎯 Próximos Passos

### Fase 1: Otimizações (Curto Prazo)
- [ ] Implementar Background Sync
- [ ] Adicionar mais recursos ao cache
- [ ] Otimizar tamanho do cache
- [ ] Implementar estratégia de cache mais agressiva

### Fase 2: Recursos Avançados (Médio Prazo)
- [ ] Periodic Background Sync
- [ ] Web Share API
- [ ] Badging API
- [ ] Install Prompt customizado
- [ ] Shortcuts dinâmicos

### Fase 3: App Nativo (Longo Prazo)
- [ ] Avaliar Capacitor vs React Native
- [ ] Desenvolver versão nativa
- [ ] Publicar na App Store
- [ ] Publicar na Google Play

---

## 📝 Comandos Úteis

```bash
# Gerar ícones
npm run generate-icons

# Build de produção
npm run build

# Preview local
npm run preview

# Verificar PWA
npm run pwa:check

# Lighthouse
lighthouse https://zapcorte.com.br --view

# Verificar service worker
curl -I https://zapcorte.com.br/sw.js

# Verificar manifest
curl https://zapcorte.com.br/manifest.json | jq

# Deploy Vercel
vercel --prod
```

---

## 🎉 Conclusão

Após seguir todos os passos deste guia, o ZapCorte estará com:

✅ PWA completo e funcional
✅ Service Worker otimizado
✅ Ícones corretos em todos os tamanhos
✅ Funcionamento offline
✅ Notificações push
✅ Instalável em qualquer dispositivo
✅ Score 100/100 no Lighthouse
✅ Pronto para produção

**Tempo estimado**: 30-60 minutos
**Dificuldade**: Média
**Resultado**: PWA profissional e completo

---

**Desenvolvido com ❤️ pela equipe ZapCorte**
