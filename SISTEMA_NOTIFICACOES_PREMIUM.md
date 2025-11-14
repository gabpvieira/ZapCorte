# 🔔 Sistema de Notificações Premium - ZapCorte

## 📋 Visão Geral

Sistema de notificações completamente redesenhado com:
- ✅ Paleta escura ZapCorte (#0A0A0A)
- ✅ Bordas coloridas por tipo
- ✅ Ícones visuais
- ✅ Efeitos sonoros
- ✅ Botão X sempre visível
- ✅ Animações suaves
- ✅ Backdrop blur

---

## 🎨 Variantes de Notificação

### 1. **Success (Verde - #00C853)**
```typescript
showToast.success("Operação concluída!", "Tudo certo por aqui.");
```
- Ícone: ✅ CheckCircle2
- Som: Frequência 800Hz (agudo, positivo)
- Uso: Confirmações, sucessos, conclusões

### 2. **Error (Vermelho)**
```typescript
showToast.error("Erro ao processar", "Tente novamente mais tarde.");
```
- Ícone: ❌ XCircle
- Som: Frequência 400Hz (grave, alerta)
- Uso: Erros, falhas, problemas críticos

### 3. **Warning (Amarelo - #FFC107)**
```typescript
showToast.warning("Atenção necessária", "Verifique os dados.");
```
- Ícone: ⚠️ AlertCircle
- Som: Frequência 600Hz (médio, atenção)
- Uso: Avisos, alertas, ações necessárias

### 4. **Info (Azul)**
```typescript
showToast.info("Informação", "Dados atualizados.");
```
- Ícone: ℹ️ Info
- Som: Frequência 700Hz (neutro)
- Uso: Informações, atualizações, dicas

### 5. **Default (Primary)**
```typescript
showToast.default("Notificação", "Mensagem padrão.");
```
- Ícone: 🔔 Bell
- Som: Frequência 700Hz (neutro)
- Uso: Notificações gerais

---

## 🚀 Exemplos de Uso

### Autenticação
```typescript
import { showToast } from '@/lib/toast-helper';

// Login bem-sucedido
showToast.auth.loginSuccess("João Silva");

// Logout
showToast.auth.logoutSuccess();

// Erro de login
showToast.auth.loginError();

// Sessão expirada
showToast.auth.sessionExpired();
```

### Agendamentos
```typescript
// Criar agendamento
showToast.appointment.created();

// Atualizar agendamento
showToast.appointment.updated();

// Cancelar agendamento
showToast.appointment.deleted();

// Confirmar agendamento
showToast.appointment.confirmed();

// Erro
showToast.appointment.error();
```

### Serviços
```typescript
// Criar serviço
showToast.service.created();

// Atualizar serviço
showToast.service.updated();

// Remover serviço
showToast.service.deleted();
```

### Configurações
```typescript
// Salvar configurações
showToast.settings.saved();

// Erro ao salvar
showToast.settings.error();
```

### WhatsApp
```typescript
// Mensagem enviada
showToast.whatsapp.sent();

// Erro ao enviar
showToast.whatsapp.error();
```

### Pagamentos
```typescript
// Pagamento confirmado
showToast.payment.success();

// Pagamento pendente
showToast.payment.pending();

// Erro no pagamento
showToast.payment.error();
```

### Rede
```typescript
// Offline
showToast.network.offline();

// Online
showToast.network.online();
```

---

## 🎨 Design System

### Cores
```css
Background: #0A0A0A (preto profundo)
Border: #27272A (cinza escuro)
Text: #FFFFFF (branco)
Description: #D1D5DB (cinza claro)

Bordas Coloridas:
- Success: #00C853 (verde)
- Error: #EF4444 (vermelho)
- Warning: #FFC107 (amarelo)
- Info: #3B82F6 (azul)
- Default: Primary color
```

### Tipografia
```css
Title: 
  - font-size: 14px
  - font-weight: 700 (bold)
  - color: #FFFFFF

Description:
  - font-size: 14px
  - font-weight: 400 (normal)
  - color: #D1D5DB
  - opacity: 0.9
```

### Espaçamento
```css
Padding: 16px (p-4)
Gap entre ícone e texto: 12px (gap-3)
Border-left: 4px
Border-radius: 8px (rounded-lg)
```

### Sombras
```css
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
backdrop-blur-sm: blur(8px)
```

---

## 🔊 Efeitos Sonoros

### Implementação
```typescript
const playNotificationSound = (variant?: string) => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Configurações por tipo
  switch (variant) {
    case 'success': 
      oscillator.frequency.value = 800; // Agudo
      break;
    case 'destructive': 
      oscillator.frequency.value = 400; // Grave
      break;
    case 'warning': 
      oscillator.frequency.value = 600; // Médio
      break;
    default: 
      oscillator.frequency.value = 700; // Neutro
  }
};
```

### Características
- Volume: 0.2 - 0.3 (suave, não intrusivo)
- Duração: 0.2 - 0.4 segundos
- Fade out: Exponencial para suavidade
- Fallback: Silencioso se áudio não disponível

---

## 🎯 Botão de Fechar

### Características
- ✅ Sempre visível (opacity: 100%)
- ✅ Posição: top-right (absolute)
- ✅ Hover: Background branco/10%
- ✅ Ícone: X (Lucide)
- ✅ Tamanho: 16px (h-4 w-4)
- ✅ Padding: 6px (p-1.5)
- ✅ Focus ring: Primary color

### Acessibilidade
```typescript
<ToastClose 
  aria-label="Fechar notificação"
  className="absolute right-2 top-2 rounded-md p-1.5 
             text-white/70 opacity-100 
             hover:opacity-100 hover:bg-white/10 hover:text-white 
             focus:ring-2 focus:ring-primary"
>
  <X className="h-4 w-4" />
</ToastClose>
```

---

## 📱 Responsividade

### Desktop
- Posição: bottom-right
- Largura máxima: 420px
- Animação: slide-in-from-bottom

### Mobile
- Posição: top-center
- Largura: 100% - 32px (padding)
- Animação: slide-in-from-top

---

## ⚡ Performance

### Otimizações
- Limite de toasts: 1 por vez (TOAST_LIMIT = 1)
- Auto-dismiss: 3-5 segundos
- Lazy loading de sons
- Memoização de ícones
- Transições CSS (GPU accelerated)

---

## 🧪 Testes

### Testar Notificações
```typescript
// No console do navegador
import { showToast } from '@/lib/toast-helper';

// Testar todas as variantes
showToast.success("Teste", "Sucesso");
showToast.error("Teste", "Erro");
showToast.warning("Teste", "Aviso");
showToast.info("Teste", "Info");
showToast.default("Teste", "Padrão");

// Testar casos específicos
showToast.auth.loginSuccess("Teste");
showToast.appointment.created();
showToast.payment.success();
```

---

## 📦 Arquivos Modificados

1. ✅ `src/components/ui/toast.tsx` - Componentes base
2. ✅ `src/components/ui/toaster.tsx` - Renderizador com sons e ícones
3. ✅ `src/lib/toast-helper.ts` - Helper functions (NOVO)

---

## 🎓 Migração do Código Antigo

### Antes
```typescript
toast({
  title: "Sucesso",
  description: "Operação concluída",
});
```

### Depois
```typescript
showToast.success("Sucesso", "Operação concluída");
```

### Buscar e Substituir
```bash
# Procurar por
toast\(\{

# Avaliar caso a caso e substituir por
showToast.success() / error() / warning() / info()
```

---

## 🎨 Customização

### Adicionar Nova Variante
```typescript
// Em toast.tsx
variant: {
  // ... variantes existentes
  custom: "border-l-purple-500 bg-[#0A0A0A] text-white border-r border-t border-b border-[#27272A]",
}

// Em toaster.tsx
case 'custom':
  return <Star className="h-5 w-5 text-purple-500 flex-shrink-0" />;

// Em toast-helper.ts
custom: (title: string, description?: string) => {
  toast({
    variant: "custom",
    title,
    description,
    duration: 4000,
  });
},
```

---

**Data:** 14 de Novembro de 2025  
**Status:** ✅ Implementado e documentado  
**Versão:** 2.0 Premium
