import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Check, Smartphone, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  initializeOneSignal,
  requestNotificationPermission,
  isNotificationEnabled,
  getPlayerId,
  savePlayerIdToBarbershop,
  sendPushNotification,
  isOneSignalConfigured,
} from '@/lib/onesignal';
import { useUserData } from '@/hooks/useUserData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const NotificationSettings = () => {
  const { toast } = useToast();
  const { barbershop } = useUserData();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configured = isOneSignalConfigured();
    setIsConfigured(configured);
    
    if (configured) {
      checkNotificationStatus();
    } else {
      setChecking(false);
    }
  }, []);

  const checkNotificationStatus = async () => {
    setChecking(true);
    try {
      await initializeOneSignal();
      const enabled = await isNotificationEnabled();
      setNotificationsEnabled(enabled);

      if (enabled) {
        const id = await getPlayerId();
        setPlayerId(id);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!isConfigured) {
      toast({
        title: 'OneSignal não configurado',
        description: 'Entre em contato com o suporte para configurar as notificações',
        variant: 'destructive',
      });
      return;
    }

    if (!barbershop?.id) {
      toast({
        title: 'Erro',
        description: 'Barbearia não encontrada',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Inicializar OneSignal
      const initialized = await initializeOneSignal();
      
      if (!initialized) {
        toast({
          title: 'Erro',
          description: 'Não foi possível inicializar o sistema de notificações',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Solicitar permissão
      const granted = await requestNotificationPermission();

      if (!granted) {
        toast({
          title: 'Permissão Negada',
          description: 'Você precisa permitir notificações nas configurações do navegador',
          variant: 'destructive',
        });
        return;
      }

      // Obter Player ID
      const id = await getPlayerId();
      
      if (!id) {
        toast({
          title: 'Erro',
          description: 'Não foi possível obter o ID de notificação',
          variant: 'destructive',
        });
        return;
      }

      // Salvar no banco
      const saved = await savePlayerIdToBarbershop(barbershop.id, id);

      if (!saved) {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar as configurações',
          variant: 'destructive',
        });
        return;
      }

      setPlayerId(id);
      setNotificationsEnabled(true);

      toast({
        title: 'Notificações Ativadas! 🎉',
        description: 'Você receberá alertas de novos agendamentos',
      });
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!playerId) {
      toast({
        title: 'Erro',
        description: 'Notificações não estão ativadas',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await sendPushNotification({
        playerId,
        title: '🎉 Teste de Notificação',
        message: 'Suas notificações estão funcionando perfeitamente!',
        data: { type: 'test' },
      });

      if (success) {
        toast({
          title: 'Notificação Enviada!',
          description: 'Verifique se recebeu a notificação',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar a notificação de teste',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar notificação de teste',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <DashboardLayout title="Notificações" subtitle="Configurações de alertas">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Notificações Push"
      subtitle="Configure alertas de novos agendamentos"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Alerta de Configuração */}
        {!isConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OneSignal não configurado</AlertTitle>
            <AlertDescription>
              As notificações push ainda não foram configuradas neste ambiente. 
              Entre em contato com o suporte técnico para ativar este recurso.
              <br /><br />
              <strong>Variáveis necessárias:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>VITE_ONESIGNAL_APP_ID</li>
                <li>VITE_ONESIGNAL_REST_API_KEY</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={notificationsEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-orange-500/50 bg-orange-500/5'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {notificationsEnabled ? (
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <Bell className="h-6 w-6 text-green-500" />
                    </div>
                  ) : (
                    <div className="p-3 bg-orange-500/10 rounded-full">
                      <BellOff className="h-6 w-6 text-orange-500" />
                    </div>
                  )}
                  <div>
                    <CardTitle>
                      {notificationsEnabled ? 'Notificações Ativas' : 'Notificações Desativadas'}
                    </CardTitle>
                    <CardDescription>
                      {notificationsEnabled
                        ? 'Você receberá alertas de novos agendamentos'
                        : 'Ative para receber alertas em tempo real'}
                    </CardDescription>
                  </div>
                </div>
                {notificationsEnabled && (
                  <Check className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Configuração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Configurar Notificações</CardTitle>
              <CardDescription>
                Receba alertas instantâneos quando um cliente agendar um horário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefícios */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Benefícios:</h3>
                <div className="space-y-2">
                  {[
                    { icon: Bell, text: 'Alertas em tempo real de novos agendamentos' },
                    { icon: Smartphone, text: 'Funciona mesmo com o app fechado' },
                    { icon: Volume2, text: 'Som de notificação personalizado' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-3 pt-4 border-t">
                {!notificationsEnabled ? (
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={loading || !isConfigured}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Ativando...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Ativar Notificações
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleTestNotification}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Testar Notificação
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Info adicional */}
              {notificationsEnabled && playerId && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>ID de Notificação:</strong> {playerId.substring(0, 20)}...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Instruções */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ative as Notificações</p>
                    <p className="text-xs text-muted-foreground">
                      Clique no botão acima e permita notificações no navegador
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Instale o App (Opcional)</p>
                    <p className="text-xs text-muted-foreground">
                      Para melhor experiência, instale o ZapCorte como PWA no seu celular
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Receba Alertas</p>
                    <p className="text-xs text-muted-foreground">
                      Sempre que um cliente agendar, você receberá uma notificação instantânea
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
