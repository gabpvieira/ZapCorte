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
  isPushSupported,
  isNotificationEnabled,
  requestNotificationPermission,
  subscribeToPush,
  saveSubscriptionToDatabase,
  sendTestNotification,
} from '@/lib/webpush';
import { useUserData } from '@/hooks/useUserData';

const NotificationSettings = () => {
  const { toast } = useToast();
  const { barbershop } = useUserData();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);
    
    if (supported) {
      checkNotificationStatus();
    } else {
      setChecking(false);
    }
  }, [barbershop?.id]);

  const checkNotificationStatus = async () => {
    setChecking(true);
    try {
      // Verificar permissão do navegador
      const hasPermission = isNotificationEnabled();
      
      if (!hasPermission) {
        setNotificationsEnabled(false);
        setChecking(false);
        return;
      }

      // Verificar se tem subscription salva no banco
      if (barbershop?.id) {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('barbershop_id', barbershop.id)
          .eq('is_active', true)
          .limit(1);

        if (!error && data && data.length > 0) {
          setNotificationsEnabled(true);
        } else {
          setNotificationsEnabled(false);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setNotificationsEnabled(false);
    } finally {
      setChecking(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      const { isIOSSafari } = await import('@/lib/webpush');
      const isIOS = isIOSSafari();
      
      toast({
        title: 'Não Suportado',
        description: isIOS 
          ? 'Para ativar notificações no iOS, você precisa adicionar o app à tela inicial primeiro'
          : 'Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Safari',
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
      console.log('🚀 Iniciando ativação de notificações...');
      
      // Solicitar permissão
      const granted = await requestNotificationPermission();

      if (!granted) {
        const permissionState = Notification.permission;
        
        let errorMessage = 'Você precisa permitir notificações nas configurações do navegador';
        
        if (permissionState === 'denied') {
          errorMessage = 'Permissão negada. Vá em Configurações > Notificações e permita para este site';
        }
        
        toast({
          title: 'Permissão Negada',
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Permissão concedida');

      // Inscrever para push
      const sub = await subscribeToPush();
      
      if (!sub) {
        console.error('❌ Falha ao criar subscription');
        toast({
          title: 'Erro ao Inscrever',
          description: 'Não foi possível criar a inscrição. Verifique o console para mais detalhes.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Subscription criada');

      // Salvar no banco
      const saved = await saveSubscriptionToDatabase(barbershop.id, sub);

      if (!saved) {
        console.error('❌ Falha ao salvar no banco');
        toast({
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar as configurações. Tente novamente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Salvo no banco com sucesso');

      setSubscription(sub);
      setNotificationsEnabled(true);

      toast({
        title: 'Notificações Ativadas! 🎉',
        description: 'Você receberá alertas de novos agendamentos',
      });
      
      // Recarregar status
      await checkNotificationStatus();
      
    } catch (error: any) {
      console.error('❌ Erro ao ativar notificações:', error);
      
      let errorMessage = 'Não foi possível ativar as notificações';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Verifique as configurações do navegador';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Notificações não suportadas neste dispositivo';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!barbershop?.id) {
      toast({
        title: 'Erro',
        description: 'Barbearia não encontrada',
        variant: 'destructive',
      });
      return;
    }

    if (!notificationsEnabled) {
      toast({
        title: 'Erro',
        description: 'Notificações não estão ativadas',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await sendTestNotification(barbershop.id);

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

              {/* Instruções para iOS/Safari */}
              {/iPad|iPhone|iPod|Safari/.test(navigator.userAgent) && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                    📱 Usuários iOS/Safari
                  </h4>
                  <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                    <p>1. Adicione o app à tela inicial (botão Compartilhar → Adicionar à Tela Inicial)</p>
                    <p>2. Abra o app pela tela inicial (não pelo navegador)</p>
                    <p>3. Ative as notificações quando solicitado</p>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3 pt-4 border-t">
                {!notificationsEnabled ? (
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={loading || !isSupported}
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
              {notificationsEnabled && subscription && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Status:</strong> Notificações configuradas com sucesso
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você receberá alertas em tempo real de novos agendamentos
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
