# Debug: Variável {{barbeiro}} não aparece

**Data**: 19/11/2025  
**Status**: 🔍 EM DEBUG

---

## 🐛 Problema Reportado

A variável `{{barbeiro}}` não está aparecendo nos botões de variáveis disponíveis na página de personalização de mensagens do WhatsApp, mesmo para usuários PRO.

---

## 🔍 Debug Adicionado

### 1. Console Logs

**No MessageCustomizer:**
```typescript
useEffect(() => {
  console.log('[MessageCustomizer] planType:', planType, 'isPro:', isPro);
}, [planType, isPro]);
```

**No WhatsAppSettings:**
```typescript
React.useEffect(() => {
  console.log('[WhatsAppSettings] barbershop:', barbershop);
  console.log('[WhatsAppSettings] plan_type:', barbershop?.plan_type);
}, [barbershop]);
```

### 2. Debug Visual

Adicionado indicador visual no label das variáveis:
```typescript
<Label className="text-sm font-medium flex items-center gap-2">
  <Sparkles className="h-4 w-4 text-primary" />
  Variáveis disponíveis (clique para copiar)
  {/* Debug */}
  <span className="text-xs text-red-500">[Debug: isPro={String(isPro)}]</span>
</Label>
```

---

## 📋 Checklist de Verificação

### No Console do Navegador (F12)

1. **Verificar logs do WhatsAppSettings:**
   ```
   [WhatsAppSettings] barbershop: { ... }
   [WhatsAppSettings] plan_type: "pro"  // ✅ Deve ser "pro"
   ```

2. **Verificar logs do MessageCustomizer:**
   ```
   [MessageCustomizer] planType: "pro" isPro: true  // ✅ Deve ser true
   ```

### Na Interface

1. **Verificar debug visual:**
   - Deve aparecer `[Debug: isPro=true]` ao lado de "Variáveis disponíveis"
   - Se aparecer `[Debug: isPro=false]`, o problema está no planType

2. **Verificar botão Barbeiro:**
   - Se `isPro=true`, deve aparecer botão "Barbeiro 👑"
   - Se não aparecer, há problema na renderização condicional

---

## 🔧 Possíveis Causas e Soluções

### Causa 1: planType não está sendo passado

**Verificar:**
```typescript
// Em WhatsAppSettings.tsx
<MessageCustomizer 
  barbershopId={barbershopId} 
  planType={barbershop.plan_type}  // ✅ Deve estar assim
/>
```

**Solução:**
- Garantir que `barbershop` está carregado antes de renderizar
- Verificar se `barbershop.plan_type` existe

### Causa 2: barbershop ainda está undefined

**Verificar:**
```typescript
// Em WhatsAppSettings.tsx
{barbershopId && barbershop && (  // ✅ Verificar ambos
  <MessageCustomizer 
    barbershopId={barbershopId} 
    planType={barbershop.plan_type}
  />
)}
```

**Solução:**
- Adicionar verificação `&& barbershop` na condição

### Causa 3: plan_type no banco está diferente

**Verificar no Supabase:**
```sql
SELECT id, name, plan_type 
FROM barbershops 
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'seu@email.com');
```

**Valores esperados:**
- `'pro'` ✅
- `'starter'` ❌
- `'freemium'` ❌
- `NULL` ❌

**Solução:**
Se não for 'pro', atualizar:
```sql
UPDATE barbershops 
SET plan_type = 'pro'
WHERE id = 'seu-barbershop-id';
```

### Causa 4: Cache do navegador

**Solução:**
1. Fazer hard refresh: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Limpar cache do navegador
3. Abrir em aba anônima

---

## 🧪 Teste Passo a Passo

### 1. Verificar Plano no Banco
```sql
SELECT 
  p.email,
  p.plan_type as profile_plan,
  b.name as barbershop_name,
  b.plan_type as barbershop_plan
FROM profiles p
JOIN barbershops b ON b.user_id = p.user_id
WHERE p.email = 'eugabrieldpv@gmail.com';
```

**Resultado esperado:**
```
email: eugabrieldpv@gmail.com
profile_plan: pro
barbershop_name: NGX Barber
barbershop_plan: pro  ✅
```

### 2. Verificar Console
1. Abrir DevTools (F12)
2. Ir para aba Console
3. Acessar página WhatsApp Settings
4. Verificar logs:
   - `[WhatsAppSettings] plan_type: "pro"`
   - `[MessageCustomizer] isPro: true`

### 3. Verificar Interface
1. Na página, procurar por `[Debug: isPro=true]`
2. Verificar se botão "Barbeiro 👑" aparece
3. Clicar no botão e verificar se copia `{{barbeiro}}`

### 4. Testar Preview
1. Adicionar `{{barbeiro}}` na mensagem
2. Verificar se preview mostra "Carlos Silva" (ou nome do preview)
3. Se mostrar `{{barbeiro}}` sem substituir, problema no formatPreview

---

## 🔄 Código Atual

### MessageCustomizer.tsx
```typescript
interface MessageCustomizerProps {
  barbershopId: string;
  planType?: string;  // ✅
}

const MessageCustomizer = ({ barbershopId, planType }: MessageCustomizerProps) => {
  const isPro = planType === 'pro';  // ✅
  
  // Debug
  useEffect(() => {
    console.log('[MessageCustomizer] planType:', planType, 'isPro:', isPro);
  }, [planType, isPro]);
  
  // ...
  
  // Renderização condicional
  {isPro ? (
    <VariableButton variable="barbeiro" label="Barbeiro 👑" />
  ) : null}
}
```

### WhatsAppSettings.tsx
```typescript
const WhatsAppSettings: React.FC = () => {
  const { barbershop } = useUserData();  // ✅
  
  // Debug
  React.useEffect(() => {
    console.log('[WhatsAppSettings] barbershop:', barbershop);
    console.log('[WhatsAppSettings] plan_type:', barbershop?.plan_type);
  }, [barbershop]);
  
  return (
    // ...
    {barbershopId && barbershop && (  // ✅ Verificar ambos
      <MessageCustomizer 
        barbershopId={barbershopId} 
        planType={barbershop.plan_type}  // ✅
      />
    )}
  );
}
```

---

## 📸 O Que Verificar na Imagem

Na imagem fornecida, vejo:
1. ❌ Botão "Barbeiro" NÃO aparece nos botões de variáveis
2. ✅ Preview mostra "Barbeiro: {{barbeiro}}" (mensagem tem a variável)
3. ❓ Não vejo o debug `[Debug: isPro=...]`

**Conclusão:** O `isPro` provavelmente está `false`, por isso o botão não aparece.

---

## 🎯 Próximos Passos

1. **Verificar console do navegador** para ver os logs
2. **Verificar se aparece** `[Debug: isPro=true]` na interface
3. **Se isPro=false**, verificar plan_type no banco de dados
4. **Reportar** o que aparece no console

---

**Status**: 🔍 AGUARDANDO FEEDBACK DO CONSOLE  
**Debug Ativo**: Sim  
**Próximo Passo**: Verificar logs do navegador
