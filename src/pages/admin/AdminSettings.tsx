import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AdminLayout } from './AdminLayout';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: 'Configuração atualizada',
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  const handleClearCache = () => {
    toast({
      title: 'Cache limpo',
      description: 'O cache do sistema foi limpo com sucesso.',
    });
  };

  const handleBackup = () => {
    toast({
      title: 'Backup iniciado',
      description: 'O backup do banco de dados foi iniciado.',
    });
  };

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        {/* Notificações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-purple-500/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-500" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-white">
                    Notificações por Email
                  </Label>
                  <p className="text-sm text-gray-400">
                    Receba alertas importantes por email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-white">
                    Notificações Push
                  </Label>
                  <p className="text-sm text-gray-400">
                    Receba notificações em tempo real no navegador
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={() => handleToggle('pushNotifications')}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-green-500/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança e acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode" className="text-white">
                    Modo Manutenção
                  </Label>
                  <p className="text-sm text-gray-400">
                    Desabilita o acesso ao sistema para usuários
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={() => handleToggle('maintenanceMode')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode" className="text-white">
                    Modo Debug
                  </Label>
                  <p className="text-sm text-gray-400">
                    Ativa logs detalhados para desenvolvimento
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={settings.debugMode}
                  onCheckedChange={() => handleToggle('debugMode')}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Banco de Dados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-purple-500/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Banco de Dados
              </CardTitle>
              <CardDescription>
                Gerenciamento e manutenção do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup" className="text-white">
                    Backup Automático
                  </Label>
                  <p className="text-sm text-gray-400">
                    Realiza backup diário do banco de dados
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={settings.autoBackup}
                  onCheckedChange={() => handleToggle('autoBackup')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackup}
                  className="flex-1 border-zinc-800 hover:bg-zinc-900 hover:border-green-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Fazer Backup Agora
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  className="flex-1 border-zinc-800 hover:bg-zinc-900 hover:border-purple-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Zona de Perigo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-950 border-red-900/50 shadow-lg shadow-red-500/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Zona de Perigo
              </CardTitle>
              <CardDescription className="text-red-400">
                Ações irreversíveis - use com cuidado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Limpar Dados Antigos</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Remove agendamentos e logs com mais de 90 dias
                </p>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados Antigos
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
