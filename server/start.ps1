# Script PowerShell para iniciar o servidor de webhooks ZapCorte
# Uso: .\start.ps1

Write-Host "🚀 Iniciando Servidor ZapCorte..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "index.js")) {
    Write-Host "❌ Erro: Execute este script no diretório 'server'" -ForegroundColor Red
    Write-Host "   cd zap-corte-pro-main/server" -ForegroundColor Yellow
    exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Aviso: Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "   Certifique-se de configurar as variáveis de ambiente." -ForegroundColor Yellow
    Write-Host ""
}

# Verificar se a porta 3001 está em uso
$port = 3001
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "⚠️  Porta $port já está em uso!" -ForegroundColor Yellow
    Write-Host "   Deseja matar o processo? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        $pid = $portInUse.OwningProcess
        Stop-Process -Id $pid -Force
        Write-Host "✅ Processo encerrado" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "❌ Abortando..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎯 Iniciando servidor na porta $port..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informações importantes:" -ForegroundColor Cyan
Write-Host "   • Health Check: http://localhost:$port/api/health" -ForegroundColor White
Write-Host "   • Webhook URL: http://localhost:$port/api/webhooks/cakto" -ForegroundColor White
Write-Host "   • Para expor publicamente, use ngrok em outro terminal:" -ForegroundColor White
Write-Host "     ngrok http $port" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 Para parar o servidor: Ctrl+C" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Iniciar servidor
npm start
