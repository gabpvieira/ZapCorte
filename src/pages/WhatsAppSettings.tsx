import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import WhatsAppConnection from '@/components/WhatsAppConnection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Zap, CheckCircle, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const WhatsAppSettings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configurações WhatsApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure a integração com WhatsApp para envio automático de lembretes
              </p>
            </div>
          </div>
        </motion.div>

        {/* Benefits Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Zap className="h-5 w-5" />
                <span className="text-lg">Automático</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Lembretes enviados automaticamente do seu número pessoal
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                <CheckCircle className="h-5 w-5" />
                <span className="text-lg">Gratuito</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Sem custos adicionais, use seu WhatsApp pessoal
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                <Users className="h-5 w-5" />
                <span className="text-lg">Personalizado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Mensagens personalizadas com dados do agendamento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp Connection Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <WhatsAppConnection />
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Como Funciona</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Tipos de Mensagens Automáticas:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Confirmação:</strong> Enviada imediatamente após o agendamento</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Lembrete:</strong> Enviada algumas horas antes do atendimento</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <MessageCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Cancelamento:</strong> Enviada quando um agendamento é cancelado</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Informações Incluídas:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start space-x-2">
                      <span>📅</span>
                      <span>Data e dia da semana do agendamento</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>🕐</span>
                      <span>Horário do atendimento</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>✂️</span>
                      <span>Serviço agendado</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>👨‍💼</span>
                      <span>Nome do profissional</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>🏪</span>
                      <span>Nome da barbearia</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppSettings;