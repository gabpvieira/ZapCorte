import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Monitor, Tablet, Trash2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';

interface DeviceSubscription {
  id: string;
  device_info: {
    type: string;
    browser: string;
    platform: string;
    isMobile: boolean;
    isTablet: boolean;
  };
  user_agent: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

const DeviceManager = () => {
  const { toast } = useToast();
  const { barbershop } = useUserData();
  const [devices, setDevices] = useState<DeviceSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (barbershop?.id) {
      loadDevices();
    }
  }, [barbershop?.id]);

  const loadDevices = async () => {
    if (!barbershop?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .order('last_used_at', { ascending: false });

      if (error) throw error;

      setDevices(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dispositivos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: 'Dispositivo Removido',
        description: 'O dispositivo foi removido com sucesso',
      });

      loadDevices();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o dispositivo',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Dispositivos" subtitle="Gerenciar dispositivos com notificações">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dispositivos Conectados"
      subtitle="Gerencie os dispositivos que recebem notificações"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Total de dispositivos conectados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{devices.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {devices.filter(d => d.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {devices.filter(d => !d.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">Inativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Dispositivos */}
        <div className="space-y-4">
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum dispositivo conectado ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ative as notificações em um dispositivo para vê-lo aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            devices.map((device, index) => {
              const Icon = getDeviceIcon(device.device_info?.type);
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={device.is_active ? '' : 'opacity-60'}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${
                            device.is_active ? 'bg-green-500/10' : 'bg-gray-500/10'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              device.is_active ? 'text-green-500' : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold capitalize">
                                {device.device_info?.type || 'Desconhecido'}
                              </h3>
                              {device.is_active ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {device.device_info?.browser || 'Navegador desconhecido'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Último uso: {formatDate(device.last_used_at)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeviceManager;
