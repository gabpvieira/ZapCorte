# Design do Modo Encaixe - ZapCorte Premium

## 🎨 Novo Design Implementado

### Card Premium com Paleta ZapCorte

O card do Modo Encaixe foi redesenhado com um visual premium que combina com a identidade visual do ZapCorte:

#### Características Visuais

**Fundo:**
- Gradiente preto: `from-zinc-900 via-zinc-900 to-amber-950/20`
- Efeito de brilho sutil com gradiente transparente
- Borda dupla amarela brilhante: `border-2 border-amber-500/30`

**Ícone:**
- Raio (Zap) amarelo: `text-amber-500`
- Caixa com fundo semi-transparente: `bg-amber-500/10`
- Tamanho: 4x4 (16px)

**Texto:**
- Título: Branco (`text-white`) e negrito
- Descrição: Cinza claro (`text-zinc-400`)
- Fonte pequena e legível

**Switch:**
- Substitui o checkbox tradicional
- Cor amarela quando ativado: `data-[state=checked]:bg-amber-500`
- Animação suave de transição
- Posicionado à direita do card

### Layout Responsivo

```
┌─────────────────────────────────────────────────┐
│  ⚡ Modo Encaixe                        ○──○    │
│                                                  │
│  Permite agendar em horários já ocupados.       │
│  Útil para serviços rápidos ou quando você      │
│  sabe que pode fazer sobreposições.             │
└─────────────────────────────────────────────────┘
```

**Quando ativado:**
```
┌─────────────────────────────────────────────────┐
│  ⚡ Modo Encaixe                        ●──●    │
│                                        (amarelo) │
│  Permite agendar em horários já ocupados.       │
│  Útil para serviços rápidos ou quando você      │
│  sabe que pode fazer sobreposições.             │
└─────────────────────────────────────────────────┘
```

## 🎯 Paleta de Cores Utilizada

- **Fundo Principal:** `zinc-900` (preto ZapCorte)
- **Fundo Secundário:** `amber-950/20` (toque de âmbar)
- **Borda:** `amber-500/30` (amarelo brilhante)
- **Ícone:** `amber-500` (amarelo vibrante)
- **Texto Principal:** `white` (branco puro)
- **Texto Secundário:** `zinc-400` (cinza claro)
- **Switch Ativo:** `amber-500` (amarelo)

## ✨ Efeitos Visuais

1. **Gradiente de Fundo:** Transição suave de preto para âmbar
2. **Brilho Sutil:** Overlay com gradiente transparente
3. **Borda Brilhante:** Amarelo com transparência para efeito neon
4. **Switch Animado:** Transição suave ao ativar/desativar
5. **Hover States:** Cursor pointer no label

## 📱 Responsividade

- **Mobile:** Layout vertical mantido, texto legível
- **Desktop:** Espaçamento otimizado, switch alinhado à direita
- **Tablet:** Adaptação automática entre os dois layouts

## 🔧 Componentes Utilizados

- `Switch` do Radix UI (ao invés de Checkbox)
- `Label` do shadcn/ui
- Ícone `Zap` do Lucide React
- Tailwind CSS para estilização

## 💡 Benefícios do Novo Design

✅ Visual premium e profissional
✅ Alinhado com a identidade ZapCorte
✅ Switch mais intuitivo que checkbox
✅ Destaque visual claro
✅ Fácil identificação da funcionalidade
✅ Acessível e responsivo
