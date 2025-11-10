# 🧪 Guia de Testes - Sistema de Upgrade

## 📋 Visão Geral

Este documento fornece cenários de teste e exemplos de código para validar o sistema de upgrade de plano.

## 🎯 Cenários de Teste

### 1. Teste de Integração - Usuário Logado

**Objetivo**: Verificar que usuário logado consegue fazer upgrade sem atrito

**Passos**:
1. Fazer login com conta Freemium
2. Navegar para "Plano & Conta"
3. Clicar em "Fazer Upgrade"
4. Verificar loading state
5. Verificar abertura de nova aba
6. Verificar URL contém dados do usuário

**Resultado Esperado**:
- ✅ Botão mostra spinner durante loading
- ✅ Nova aba abre com checkout
- ✅ URL contém: email, user_id, plan, timestamp
- ✅ Toast de confirmação aparece
- ✅ Botão volta ao estado normal após processo

### 2. Teste de Validação - Usuário Não Logado

**Objetivo**: Verificar que usuário não logado é redirecionado para login

**Passos**:
1. Fazer logout (se logado)
2. Tentar acessar página de planos
3. Clicar em "Assinar Agora"

**Resultado Esperado**:
- ✅ Toast de aviso aparece
- ✅ Redirecionamento para `/login`
- ✅ Nenhuma aba de checkout é aberta

### 3. Teste de Robustez - Múltiplos Cliques

**Objetivo**: Verificar que múltiplos cliques não causam problemas

**Passos**:
1. Fazer login
2. Navegar para página de planos
3. Clicar rapidamente 5 vezes em "Fazer Upgrade"

**Resultado Esperado**:
- ✅ Botão desabilita após primeiro clique
- ✅ Apenas uma aba de checkout é aberta
- ✅ Loading state funciona corretamente
- ✅ Sem erros no console

### 4. Teste de Erro - Falha na Busca de Dados

**Objetivo**: Verificar tratamento de erro quando dados não podem ser buscados

**Passos**:
1. Simular erro no Supabase (desconectar rede)
2. Tentar fazer upgrade

**Resultado Esperado**:
- ✅ Toast de erro aparece
- ✅ Loading state é desativado
- ✅ Botão volta ao estado normal
- ✅ Nenhuma aba é aberta

### 5. Teste de Dados - Pré-preenchimento

**Objetivo**: Verificar que dados do usuário são enviados corretamente

**Passos**:
1. Fazer login com usuário que tem perfil completo
2. Fazer upgrade
3. Inspecionar URL gerada

**Resultado Esperado**:
- ✅ URL contém `email=usuario@example.com`
- ✅ URL contém `user_id=abc123`
- ✅ URL contém `plan=starter` ou `plan=pro`
- ✅ URL contém `first_name=Nome`
- ✅ URL contém `last_name=Sobrenome`
- ✅ URL contém `phone=11999999999`
- ✅ URL contém `timestamp=2025-11-10T...`

## 🔧 Testes Manuais - Checklist

### Pré-requisitos
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados com dados de teste
- [ ] Usuário Freemium criado
- [ ] Navegador com console aberto

### Teste Completo
- [ ] Login funciona
- [ ] Página de planos carrega
- [ ] Botão "Fazer Upgrade" aparece
- [ ] Clicar no botão mostra loading
- [ ] Nova aba abre com checkout
- [ ] URL contém dados corretos
- [ ] Toast de confirmação aparece
- [ ] Botão volta ao normal
- [ ] Sem erros no console

### Teste de Planos Diferentes
- [ ] Upgrade para Starter funciona
- [ ] Upgrade para Pro funciona
- [ ] URLs são diferentes para cada plano
- [ ] Botões nos cards de comparação funcionam

### Teste de Estados
- [ ] Loading state funciona
- [ ] Disabled state funciona
- [ ] Hover state funciona
- [ ] Focus state funciona

## 🧪 Exemplos de Testes Automatizados

### Teste Unitário - Hook useCaktoCheckout

```typescript
// __tests__/hooks/useCaktoCheckout.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCaktoCheckout } from '@/hooks/useCaktoCheckout';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');

describe('useCaktoCheckout', () => {
  it('deve retornar isLoading como false inicialmente', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useCaktoCheckout());
    
    expect(result.current.isLoading).toBe(false);
  });

  it('deve retornar isUserLoggedIn como true quando usuário está logado', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '123', email: 'test@example.com' } 
    });
    
    const { result } = renderHook(() => useCaktoCheckout());
    
    expect(result.current.isUserLoggedIn).toBe(true);
  });

  it('deve gerar URL correta para plano Starter', async () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: '123', email: 'test@example.com' } 
    });
    
    const { result } = renderHook(() => useCaktoCheckout());
    
    const url = await result.current.getCheckoutUrl('starter');
    
    expect(url).toContain('pay.cakto.com.br');
    expect(url).toContain('email=test@example.com');
    expect(url).toContain('user_id=123');
    expect(url).toContain('plan=starter');
  });
});
```

### Teste de Componente - UpgradeButton

```typescript
// __tests__/components/UpgradeButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradeButton } from '@/components/UpgradeButton';
import { useCaktoCheckout } from '@/hooks/useCaktoCheckout';

jest.mock('@/hooks/useCaktoCheckout');

describe('UpgradeButton', () => {
  it('deve renderizar com texto padrão', () => {
    (useCaktoCheckout as jest.Mock).mockReturnValue({
      handleUpgrade: jest.fn(),
      isLoading: false
    });

    render(<UpgradeButton planType="starter" />);
    
    expect(screen.getByText('Fazer Upgrade')).toBeInTheDocument();
  });

  it('deve mostrar loading quando isLoading é true', () => {
    (useCaktoCheckout as jest.Mock).mockReturnValue({
      handleUpgrade: jest.fn(),
      isLoading: true
    });

    render(<UpgradeButton planType="starter" />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve chamar handleUpgrade ao clicar', () => {
    const mockHandleUpgrade = jest.fn();
    (useCaktoCheckout as jest.Mock).mockReturnValue({
      handleUpgrade: mockHandleUpgrade,
      isLoading: false
    });

    render(<UpgradeButton planType="starter" />);
    
    fireEvent.click(screen.getByText('Fazer Upgrade'));
    
    expect(mockHandleUpgrade).toHaveBeenCalledWith('starter');
  });

  it('deve estar desabilitado durante loading', () => {
    (useCaktoCheckout as jest.Mock).mockReturnValue({
      handleUpgrade: jest.fn(),
      isLoading: true
    });

    render(<UpgradeButton planType="starter" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Teste E2E - Fluxo Completo (Playwright)

```typescript
// e2e/upgrade-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('deve fazer upgrade para Starter com sucesso', async ({ page, context }) => {
    // Navegar para página de planos
    await page.goto('/plan');
    
    // Clicar em Fazer Upgrade
    const upgradeButton = page.locator('text=Fazer Upgrade').first();
    await upgradeButton.click();
    
    // Verificar loading state
    await expect(page.locator('text=Carregando...')).toBeVisible();
    
    // Aguardar nova aba
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      upgradeButton.click()
    ]);
    
    // Verificar URL da nova aba
    await newPage.waitForLoadState();
    const url = newPage.url();
    expect(url).toContain('pay.cakto.com.br');
    expect(url).toContain('email=test@example.com');
    expect(url).toContain('plan=starter');
    
    // Verificar toast
    await expect(page.locator('text=Redirecionando para pagamento')).toBeVisible();
  });

  test('deve mostrar erro quando não há conexão', async ({ page, context }) => {
    // Simular offline
    await context.setOffline(true);
    
    // Tentar fazer upgrade
    await page.goto('/plan');
    await page.click('text=Fazer Upgrade');
    
    // Verificar toast de erro
    await expect(page.locator('text=Erro no checkout')).toBeVisible();
  });
});
```

## 📊 Métricas de Teste

### Cobertura Esperada
- **Hooks**: 80%+
- **Componentes**: 85%+
- **Integração**: 70%+
- **E2E**: Fluxos críticos

### Casos de Teste Mínimos
- ✅ 5 testes unitários (hook)
- ✅ 4 testes de componente
- ✅ 2 testes de integração
- ✅ 2 testes E2E

## 🐛 Debugging

### Console Logs Úteis

O sistema já inclui logs para debugging:

```typescript
// No hook useCaktoCheckout.ts
console.log('✅ Redirecionamento para checkout realizado com sucesso');
console.error('❌ Erro ao redirecionar para checkout:', error);

// Para adicionar mais logs:
console.log('🔍 Dados do usuário:', userData);
console.log('🔗 URL gerada:', checkoutUrl);
```

### Verificar Estado no DevTools

```javascript
// No console do navegador:

// Verificar usuário logado
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).getCurrentFiber()

// Verificar estado do hook
// (Inspecionar componente no React DevTools)
```

## 🔍 Testes de Regressão

### Após Mudanças no Código

Sempre testar:
1. Login ainda funciona
2. Upgrade para Starter funciona
3. Upgrade para Pro funciona
4. Loading state funciona
5. Toasts aparecem corretamente
6. URLs são geradas corretamente

### Após Mudanças no Banco

Sempre testar:
1. Dados do perfil são buscados
2. Campos opcionais não quebram o fluxo
3. Usuários sem perfil completo ainda conseguem fazer upgrade

## 📝 Relatório de Teste

### Template de Relatório

```markdown
# Relatório de Teste - Sistema de Upgrade

**Data**: 2025-11-10
**Testador**: [Nome]
**Ambiente**: [Desenvolvimento/Staging/Produção]

## Resumo
- Total de testes: X
- Passou: Y
- Falhou: Z
- Bloqueado: W

## Detalhes

### Teste 1: Upgrade Usuário Logado
- Status: ✅ Passou
- Tempo: 2min
- Observações: Funcionou perfeitamente

### Teste 2: Usuário Não Logado
- Status: ✅ Passou
- Tempo: 1min
- Observações: Redirecionamento correto

### Teste 3: Múltiplos Cliques
- Status: ❌ Falhou
- Tempo: 1min
- Observações: Abriu 2 abas
- Bug ID: #123

## Bugs Encontrados
1. [#123] Múltiplos cliques abrem múltiplas abas
2. [#124] Toast não aparece em Safari

## Recomendações
- Adicionar debounce no botão
- Testar em mais navegadores
```

## 🚀 Automação de Testes

### GitHub Actions

```yaml
# .github/workflows/test-upgrade.yml
name: Test Upgrade Flow

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:upgrade
      - run: npm run test:e2e
```

### Scripts NPM

```json
{
  "scripts": {
    "test:upgrade": "jest --testPathPattern=upgrade",
    "test:upgrade:watch": "jest --testPathPattern=upgrade --watch",
    "test:e2e:upgrade": "playwright test e2e/upgrade-flow.spec.ts"
  }
}
```

---

**Nota**: Adapte os testes conforme necessário para seu ambiente e ferramentas de teste.
