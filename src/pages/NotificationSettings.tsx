import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { showToast } from '@/lib/toast-helper';
import {
  enablePushNotifications,
  disablePushNotifications,
  areNotificationsEnabled,
  isPushSupported,
  getNotificationPermission,
} from '@/lib/webpush';

const NotificationSettings = () => {
  const { barbershop } = useUserData();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Verificar status inicial
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setIsChecking(true);
    try {
      const enabled = await areNotificationsEnabled();
      setIsEnabled(enabled);
      setPermission(getNotificationPermission());
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!barbershop?.id) {
      showToast.error('Erro', 'Barbearia não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const result = await enablePushNotifications(barbershop.id);
      
      if (result.success) {
        setIsEnabled(true);
        setPermission('granted');
        showToast.success('Notificações Ativadas!', result.message);
      } else {
        showToast.error('Erro ao Ativar', result.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast.error('Erro', 'Erro ao ativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!barbershop?.id) {
      showToast.error('Erro', 'Barbearia não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const result = await disablePushNotifications(barbershop.id);
      
      if (result.success) {
        setIsEnabled(false);
        showToast.info('Notificações Desativadas', result.message);
      } else {
        showToast.error('Erro ao Desativar', result.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast.error('Erro', 'Erro ao desativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!barbershop?.id) {
      showToast.error('Erro', 'Barbearia não encontrada');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barbershopId: barbershop.id,
          type: 'test',
          data: {},
        }),
      });

      if (response.ok) {
        showToast.success('Teste Enviado!', 'Verifique se a notificação chegou');
      } else {
        showToast.error('Erro', 'Erro ao enviar notificação de teste');
      }
    } catch (error) {
      console.error('Erro:', error);
      showToast.error('Erro', 'Erro ao enviar notificação de teste');
    } finally {
      setIsLoading(false);
    }
  };

  const isSupported = isPushSupported();

  return (
    <DashboardLayout
      title="Notificações Push"
      subtitle="Configure as notificações de novos agendamentos"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEnabled ? (
                <>
                  <Bell className="h-5 w-5 text-green-500" />
                  Notificações Ativadas
                </>
              ) : (
                <>
                  <BellOff className="h-5 w-5 text-gray-400" />
                  Notificações Desativadas
                </>
              )}
            </CardTitle>
            <CardDescription>
              Receba notificações instantâneas quando um cliente fizer um agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Seu navegador não suporta notificações push. 
                  Tente usar Chrome, Firefox ou Safari atualizado.
                </p>
              </div>
            ) : (
              <>
                {/* Status Visual */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Status</p>
                      <p className="text-sm font-medium">
                        {isChecking ? (
                          <span className="text-gray-600 dark:text-gray-400">Verificando...</span>
                        ) : isEnabled ? (
                          <span className="text-green-600 dark:text-green-500">Ativo</span>
                        ) : (
                          <span className="text-gray-900 dark:text-white">Inativo</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isEnabled ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Permissão */}
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Permissão do Navegador:</p>
                  <div className="flex items-center gap-2">
                    {permission === 'granted' && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Concedida
                      </span>
                    )}
                    {permission === 'denied' && (
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Negada
                      </span>
                    )}
                    {permission === 'default' && (
                      <span className="text-sm text-gray-600">
                        Não solicitada
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3">
                  {!isEnabled ? (
                    <Button
                      onClick={handleEnableNotifications}
                      disabled={isLoading || isChecking}
                      className="flex-1"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {isLoading ? 'Ativando...' : 'Ativar Notificações'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleTestNotification}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        Testar Notificação
                      </Button>
                      <Button
                        onClick={handleDisableNotifications}
                        disabled={isLoading}
                        variant="destructive"
                      >
                        <BellOff className="h-4 w-4 mr-2" />
                        Desativar
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Ative as Notificações</p>
                <p className="text-sm text-muted-foreground">
                  Clique no botão acima e permita notificações no navegador
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Receba Notificações Instantâneas</p>
                <p className="text-sm text-muted-foreground">
                  Quando um cliente agendar, você receberá uma notificação no celular ou computador
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Clique para Ver Detalhes</p>
                <p className="text-sm text-muted-foreground">
                  Clique na notificação para ir direto ao painel de agendamentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• As notificações funcionam mesmo com o navegador fechado</p>
            <p>• Você pode desativar a qualquer momento</p>
            <p>• Funciona em celular e computador</p>
            <p>• Totalmente gratuito e sem limites</p>
            <p>• Seus dados ficam seguros no seu servidor</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
