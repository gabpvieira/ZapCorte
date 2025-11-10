import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Smartphone,
  AlertCircle,
  Zap,
  Phone,
  Settings,
  Send,
  Clock,
  Bell
} from 'lucide-react';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { evolutionApi } from '@/lib/evolutionApi';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';

const WhatsAppConnection: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    qrCode,
    sessionId,
    phone,
    error,
    startConnection,
    disconnect,
    refreshStatus,
    forceQRCodeRefresh,
  } = useWhatsAppConnection();

  const {
    settings,
    loading: settingsLoading,
    saving: settingsSaving,
    error: settingsError,
    saveSettings,
    testMessage,
  } = useWhatsAppSettings();

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingMessage, setTestingMessage] = useState(false);
  const [testMessageResult, setTestMessageResult] = useState<string | null>(null);

  const testApiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await evolutionApi.testConnection();
      if (result.success) {
        setTestResult('✅ Integração funcionando');
      } else {
        setTestResult('❌ Problema na integração');
      }
    } catch (error) {
      setTestResult('❌ Erro ao verificar');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestMessage = async () => {
    setTestingMessage(true);
    setTestMessageResult(null);

    try {
      const success = await testMessage();
      if (success) {
        setTestMessageResult('✅ Mensagem de teste enviada para você!');
      } else {
        setTestMessageResult('❌ Erro ao enviar mensagem de teste');
      }
    } catch (error) {
      setTestMessageResult(`❌ ${error instanceof Error ? error.message : 'Erro ao enviar mensagem'}`);
    } finally {
      setTestingMessage(false);
    }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    try {
      await saveSettings({ [key]: value });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integração WhatsApp</h1>
          <p className="text-muted-foreground">
            Configure lembretes automáticos para seus clientes
          </p>
        </div>
      </div>

      {/* Status da Conexão */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Status da Conexão</span>
            </span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connected State */}
          {isConnected && phone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    WhatsApp Conectado com Sucesso!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Número: {phone}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button variant="outline" size="sm" onClick={refreshStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </Button>
                <Button variant="destructive" size="sm" onClick={disconnect}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </motion.div>
          )}

          {/* QR Code State */}
          {!isConnected && qrCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="p-6 bg-muted rounded-lg border-2 border-dashed">
                <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Escaneie o QR Code
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Abra o WhatsApp no seu celular e escaneie o código abaixo
                </p>
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                  <img 
                    src={(() => {
                      if (qrCode.startsWith('data:image/')) return qrCode;
                      if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) return qrCode;
                      return `data:image/png;base64,${qrCode}`;
                    })()} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 mx-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const currentSrc = target.src;
                      
                      if (currentSrc.includes('data:image/png;base64,')) {
                        target.src = qrCode.startsWith('data:') ? qrCode : `data:image/jpeg;base64,${qrCode}`;
                      } else if (currentSrc.includes('data:image/jpeg;base64,')) {
                        target.src = qrCode;
                      } else {
                        const cleanBase64 = qrCode.replace(/^data:image\/[^;]+;base64,/, '');
                        target.src = `data:image/png;base64,${cleanBase64}`;
                      }
                    }}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Aguardando conexão...</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={forceQRCodeRefresh}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar QR Code
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading QR Code State */}
          {!isConnected && !qrCode && !isConnecting && sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Carregando QR Code
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  O QR Code está sendo gerado. Se não aparecer, clique em "Atualizar QR Code"
                </p>
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" size="sm" onClick={forceQRCodeRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar QR Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={startConnection}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Reconectar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Disconnected State */}
          {!isConnected && !qrCode && !isConnecting && !sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="p-8 bg-muted rounded-lg">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  WhatsApp Desconectado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Conecte seu WhatsApp para enviar lembretes automáticos aos seus clientes
                </p>
                <Button onClick={startConnection} size="lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Conectar WhatsApp
                </Button>
              </div>
            </motion.div>
          )}

          {/* Connecting State */}
          {isConnecting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">
                  Iniciando Conexão
                </h3>
                <p className="text-muted-foreground">
                  Preparando QR Code para conexão...
                </p>
              </div>
            </motion.div>
          )}

        </CardContent>
      </Card>

      {/* Configurações de Lembretes */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações de Lembretes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{settingsError}</AlertDescription>
            </Alert>
          )}

          {/* Ativar/Desativar Lembretes */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Lembretes Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembretes automáticos para os clientes
              </p>
            </div>
            <Switch
              checked={settings.reminders_enabled}
              onCheckedChange={(checked) => handleSettingChange('reminders_enabled', checked)}
              disabled={settingsLoading || settingsSaving}
            />
          </div>

          {/* Intervalo de Lembrete */}
          <div className="space-y-2">
            <Label>Intervalo do Lembrete</Label>
            <Select
              value={settings.reminder_interval}
              onValueChange={(value) => handleSettingChange('reminder_interval', value)}
              disabled={settingsLoading || settingsSaving || !settings.reminders_enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>30 minutos antes</span>
                  </div>
                </SelectItem>
                <SelectItem value="60">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>1 hora antes</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem Personalizada */}
          <div className="space-y-2">
            <Label>Mensagem do Lembrete</Label>
            <Textarea
              placeholder="Digite a mensagem que será enviada aos clientes..."
              value={settings.reminder_message}
              onChange={(e) => handleSettingChange('reminder_message', e.target.value)}
              disabled={settingsLoading || settingsSaving || !settings.reminders_enabled}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use as variáveis: {'{nome}'}, {'{data}'}, {'{hora}'}, {'{servico}'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Mensagem */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Teste de Mensagem</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              O teste será enviado para o seu próprio número do WhatsApp conectado.
              {phone && (
                <span className="block mt-1 font-medium text-foreground">
                  Número conectado: {phone}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleTestMessage}
              disabled={testingMessage || !isConnected}
              variant="outline"
            >
              {testingMessage ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste para Mim
                </>
              )}
            </Button>
            {testMessageResult && (
              <span className="text-sm font-mono">{testMessageResult}</span>
            )}
          </div>

          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conecte o WhatsApp primeiro para poder testar o envio de mensagens.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status da Integração */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Verificar Integração</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Teste se a integração com o WhatsApp está funcionando corretamente
          </p>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={testApiConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Testar Integração
                </>
              )}
            </Button>
            {testResult && (
              <div className="flex items-center space-x-2">
                {testResult.includes('✅') ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  {testResult.includes('✅') 
                    ? 'Integração funcionando perfeitamente!' 
                    : 'Problema na integração. Tente reconectar.'}
                </span>
              </div>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Como funciona?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Conecte seu WhatsApp pessoal de forma segura</li>
              <li>• Lembretes são enviados automaticamente do seu número</li>
              <li>• Seus clientes recebem mensagens personalizadas</li>
              <li>• Configure o intervalo: 30 minutos ou 1 hora antes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConnection;