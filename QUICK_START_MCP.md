# ⚡ Quick Start: MCP Supabase no Cursor

## 🎯 Resumo Rápido

Conecte o Supabase ao Cursor em 3 passos simples!

## 📝 Passo 1: Obter Credenciais

### 1.1 Token de Acesso
1. Acesse: https://supabase.com/dashboard
2. Vá em: **Account Settings** → **Access Tokens**
3. Clique em: **Generate New Token**
4. Nome: `Cursor MCP`
5. **Copie o token** (começa com `sbp_...`)

### 1.2 Project Reference
1. No projeto Supabase: **Settings** → **General**
2. Copie o **Reference ID** (ex: `abcdefghijklmnop`)

## 🔧 Passo 2: Configurar no Cursor

### Opção 1: Via Interface (Recomendado)

1. No Cursor, pressione `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
2. Digite: `MCP: Configure Server`
3. Selecione: `Add New Server`
4. Preencha:
   - **Name**: `supabase`
   - **Command**: `npx`
   - **Args**: `-y @supabase/mcp-server`
   - **Env Variables**:
     - `SUPABASE_ACCESS_TOKEN`: seu token
     - `SUPABASE_PROJECT_REF`: seu project ref

### Opção 2: Via Arquivo de Configuração

1. Abra o arquivo de configuração do MCP:

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

**Mac:**
```
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

**Linux:**
```
~/.config/Cursor/User/globalStorage/mcp.json
```

2. Adicione esta configuração:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_TOKEN_AQUI",
        "SUPABASE_PROJECT_REF": "SEU_PROJECT_REF_AQUI"
      }
    }
  }
}
```

3. Substitua:
   - `SEU_TOKEN_AQUI` pelo token que você copiou
   - `SEU_PROJECT_REF_AQUI` pelo Reference ID do projeto

4. Salve o arquivo
5. **Reinicie o Cursor**

## ✅ Passo 3: Verificar Conexão

1. No Cursor, pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P`)
2. Digite: `MCP: List Resources`
3. Você deve ver recursos do Supabase

**Teste rápido:**
- Pergunte ao Cursor: "Liste as tabelas do meu banco de dados Supabase"
- Ou: "Mostre a estrutura da tabela barbershops"

## 🎉 Pronto!

Agora você pode:
- ✅ Consultar dados do banco
- ✅ Criar/modificar tabelas
- ✅ Executar queries SQL
- ✅ Ver schemas e estruturas
- ✅ Gerenciar dados

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite tokens no Git
- Use variáveis de ambiente quando possível
- Mantenha tokens seguros e privados

## 🐛 Problemas?

### "Token inválido"
- Verifique se o token está correto
- Gere um novo token se necessário

### "Project not found"
- Verifique se o Project Ref está correto
- Verifique se você tem acesso ao projeto

### MCP não aparece
- Reinicie o Cursor
- Verifique se está usando versão recente do Cursor
- Verifique os logs: `Settings → MCP → Logs`

## 📚 Documentação Completa

Para mais detalhes, consulte: `GUIA_MCP_SUPABASE.md`

---

**Dica:** Você pode usar o arquivo `mcp.config.example.json` como base para sua configuração!

