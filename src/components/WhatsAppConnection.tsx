import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Bell,
  RotateCcw
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

  // State local para as mensagens (digitação livre)
  const [localConfirmationMessage, setLocalConfirmationMessage] = useState('');
  const [localRescheduleMessage, setLocalRescheduleMessage] = useState('');
  const [localReminderMessage, setLocalReminderMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingMessages, setSavingMessages] = useState(false);

  // Mensagens padrão
  const defaultMessages = {
    confirmation: `Olá {nome}! ✅

Seu agendamento foi confirmado com sucesso!

📅 Data: {data}
🕐 Horário: {hora}
✂️ Serviço: {servico}

Nos vemos em breve! 😊`,
    
    reschedule: `Olá {nome}! 🔄

Seu agendamento foi reagendado:

📅 Nova Data: {data}
🕐 Novo Horário: {hora}
✂️ Serviço: {servico}

Qualquer dúvida, estamos à disposição!`,
    
    reminder: `Olá {nome}! ⏰

Lembrete: você tem um agendamento hoje!

🕐 Horário: {hora}
✂️ Serviço: {servico}

Nos vemos em breve! ✂️`
  };

  // Sincronizar state local com settings quando carregar
  useEffect(() => {
    if (!settingsLoading) {
      setLocalConfirmationMessage(settings.confirmation_message || defaultMessages.confirmation);
      setLocalRescheduleMessage(settings.reschedule_message || defaultMessages.reschedule);
      setLocalReminderMessage(settings.reminder_message || defaultMessages.reminder);
      setHasUnsavedChanges(false);
    }
  }, [settings, settingsLoading]);

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

  // Salvar imediatamente (para switches e selects)
  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    try {
      await saveSettings({ [key]: value });
    } catch (error) {
      console.error('Erro ao alterar configuração:', error);
    }
  };

  // Atualizar mensagem localmente (digitação livre)
  const handleMessageChange = (key: 'confirmation_message' | 'reschedule_message' | 'reminder_message', value: string) => {
    // Atualizar state local imediatamente
    if (key === 'confirmation_message') setLocalConfirmationMessage(value);
    if (key === 'reschedule_message') setLocalRescheduleMessage(value);
    if (key === 'reminder_message') setLocalReminderMessage(value);
    
    // Marcar como tendo alterações não salvas
    setHasUnsavedChanges(true);
  };

  // Salvar todas as mensagens de uma vez
  const handleSaveMessages = async () => {
    try {
      setSavingMessages(true);
      await saveSettings({
        confirmation_message: localConfirmationMessage,
        reschedule_message: localRescheduleMessage,
        reminder_message: localReminderMessage,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
    } finally {
      setSavingMessages(false);
    }
  };

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between w-full overflow-x-hidden">
        <div>
          <h1 className="text-3xl font-bold">Integração WhatsApp</h1>
          <p className="text-muted-foreground">
            Configure lembretes automáticos para seus clientes
          </p>
        </div>
      </div>

      {/* Status da Conexão */}
      <Card className="border-2 w-full max-w-full overflow-hidden">
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
        <CardContent className="space-y-6 w-full overflow-x-hidden">
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
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm max-w-full overflow-hidden">
                  <img 
                    src={(() => {
                      if (qrCode.startsWith('data:image/')) return qrCode;
                      if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) return qrCode;
                      return `data:image/png;base64,${qrCode}`;
                    })()} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 max-w-full mx-auto object-contain"
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



      {/* Teste de Mensagem */}
      <Card className="border-2 w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Teste de Mensagem</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full overflow-x-hidden">
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
      <Card className="border-2 w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Verificar Integração</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full overflow-x-hidden">
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

      {/* SEÇÃO: Personalização de Mensagens */}
      {isConnected && (
        <Card className="border-2 w-full max-w-full overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Personalização de Mensagens</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Customize as mensagens automáticas enviadas aos seus clientes
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="confirmation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="confirmation" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Confirmação</span>
                </TabsTrigger>
                <TabsTrigger value="reschedule" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reagendamento</span>
                </TabsTrigger>
                <TabsTrigger value="reminder" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Lembrete</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB: Confirmação */}
              <TabsContent value="confirmation" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Mensagem de Confirmação
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enviada imediatamente após o cliente agendar
                  </p>
                  <Textarea
                    placeholder="Digite a mensagem de confirmação..."
                    value={localConfirmationMessage}
                    onChange={(e) => handleMessageChange('confirmation_message', e.target.value)}
                    disabled={settingsLoading}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{'{nome}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{data}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{hora}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{servico}'}</Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-xs font-medium text-green-600">Preview</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
                    {localConfirmationMessage
                      .replace(/{nome}/g, 'João')
                      .replace(/{data}/g, '15/11/2024')
                      .replace(/{hora}/g, '14:30')
                      .replace(/{servico}/g, 'Corte + Barba') || 
                      'Digite uma mensagem...'}
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Reagendamento */}
              <TabsContent value="reschedule" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base">
                    <RotateCcw className="h-4 w-4 text-blue-600" />
                    Mensagem de Reagendamento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enviada quando um agendamento é alterado
                  </p>
                  <Textarea
                    placeholder="Digite a mensagem de reagendamento..."
                    value={localRescheduleMessage}
                    onChange={(e) => handleMessageChange('reschedule_message', e.target.value)}
                    disabled={settingsLoading}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{'{nome}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{data}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{hora}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{servico}'}</Badge>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 mt-1" />
                    <span className="text-xs font-medium text-blue-600">Preview</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
                    {localRescheduleMessage
                      .replace(/{nome}/g, 'João')
                      .replace(/{data}/g, '15/11/2024')
                      .replace(/{hora}/g, '14:30')
                      .replace(/{servico}/g, 'Corte + Barba') || 
                      'Digite uma mensagem...'}
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Lembrete */}
              <TabsContent value="reminder" className="space-y-4">
                {/* Switch de Lembretes */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Lembretes Automáticos</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes antes do horário
                    </p>
                  </div>
                  <Switch
                    checked={settings.reminders_enabled}
                    onCheckedChange={(checked) => handleSettingChange('reminders_enabled', checked)}
                    disabled={settingsLoading || settingsSaving}
                  />
                </div>

                {settings.reminders_enabled && (
                  <>
                    {/* Intervalo */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Intervalo do Lembrete
                      </Label>
                      <Select
                        value={settings.reminder_interval}
                        onValueChange={(value) => handleSettingChange('reminder_interval', value)}
                        disabled={settingsLoading || settingsSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos antes</SelectItem>
                          <SelectItem value="60">1 hora antes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mensagem */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-base">
                        <Bell className="h-4 w-4 text-purple-600" />
                        Mensagem do Lembrete
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enviada antes do horário agendado
                      </p>
                      <Textarea
                        placeholder="Digite a mensagem de lembrete..."
                        value={localReminderMessage}
                        onChange={(e) => handleMessageChange('reminder_message', e.target.value)}
                        disabled={settingsLoading}
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{'{nome}'}</Badge>
                        <Badge variant="outline" className="text-xs">{'{data}'}</Badge>
                        <Badge variant="outline" className="text-xs">{'{hora}'}</Badge>
                        <Badge variant="outline" className="text-xs">{'{servico}'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Use emojis e quebras de linha livremente
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-start gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-purple-600 mt-1" />
                        <span className="text-xs font-medium text-purple-600">Preview</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {localReminderMessage
                          .replace(/{nome}/g, 'João')
                          .replace(/{data}/g, '15/11/2024')
                          .replace(/{hora}/g, '14:30')
                          .replace(/{servico}/g, 'Corte + Barba') || 
                          'Digite uma mensagem...'}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {/* Botão Salvar */}
            <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Você tem alterações não salvas</span>
                  </div>
                )}
                {!hasUnsavedChanges && !savingMessages && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Todas as alterações salvas</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSaveMessages}
                disabled={!hasUnsavedChanges || savingMessages}
                size="lg"
                className="min-w-[150px]"
              >
                {savingMessages ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar Mensagens
                  </>
                )}
              </Button>
            </div>

            {settingsError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{settingsError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppConnection;