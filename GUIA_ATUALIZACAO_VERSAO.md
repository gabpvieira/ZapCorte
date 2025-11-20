# Guia Rápido de Atualização de Versão

## 📋 Checklist de Atualização

### 1. Atualizar Versão
```bash
npm run version:update X.Y.Z
```

### 2. Atualizar CHANGELOG
Editar `src/config/version.ts`:

```typescript
export const CHANGELOG = {
  'X.Y.Z': [
    'Descrição da mudança 1',
    'Descrição da mudança 2',
    'Descrição da mudança 3'
  ],
  // versões anteriores...
}
```

### 3. Commit e Push
```bash
git add .
git commit -m "chore: bump version to X.Y.Z

- Descrição da mudança 1
- Descrição da mudança 2
- Descrição da mudança 3"
git push
```

## 📝 Formato de Versionamento

**MAJOR.MINOR.PATCH** (ex: 2.4.0)

- **MAJOR**: Mudanças incompatíveis (breaking changes)
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

## 🎯 Exemplos de Mensagens de Commit

### Nova Funcionalidade (MINOR)
```bash
git commit -m "feat: adiciona sistema de notificações reais

- Notificações de agendamentos em tempo real
- Integração com Supabase
- Badge com contador de não lidas"
```

### Correção (PATCH)
```bash
git commit -m "fix: corrige tela preta após atualização

- Splash screen apenas no PWA instalado
- Melhora detecção de PWA
- Previne loops de atualização"
```

### Melhoria (MINOR)
```bash
git commit -m "feat: melhora sistema de atualização PWA

- Splash screen profissional
- Barra de progresso animada
- Preserva dados de autenticação"
```

## ⚡ Comando Rápido

```bash
# Atualizar versão, editar changelog, commit e push
npm run version:update 2.5.0 && \
git add . && \
git commit -m "chore: bump version to 2.5.0" && \
git push
```

## 📌 Lembre-se

1. ✅ Sempre atualizar o CHANGELOG antes do commit
2. ✅ Usar mensagens de commit descritivas
3. ✅ Seguir o padrão de versionamento semântico
4. ✅ Testar localmente antes do push
5. ✅ Verificar que todos os arquivos foram atualizados

## 🔍 Verificar Versão Atual

```bash
# No código
cat src/config/version.ts | grep APP_VERSION

# No package.json
cat package.json | grep version
```
