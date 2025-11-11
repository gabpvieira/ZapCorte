import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import WhatsAppConnection from '@/components/WhatsAppConnection';
import MessageCustomizer from '@/components/MessageCustomizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Zap, CheckCircle, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <DashboardLayout
      title="Integração WhatsApp"
      subtitle="Configure lembretes automáticos para seus clientes"
    >
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">

        {/* WhatsApp Connection Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <WhatsAppConnection />
        </motion.div>

        {/* NOVA SEÇÃO: Personalização de Mensagens */}
        {user?.barbershop_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <MessageCustomizer barbershopId={user.barbershop_id} />
          </motion.div>
        )}

        {/* Como Funciona - Redesenhado e Otimizado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>Como Funciona</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Tipos de Mensagens */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Mensagens Automáticas
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
                        Confirmação de Agendamento
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                        Enviada automaticamente quando você aceita um novo agendamento
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                        Lembrete Antes do Horário
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        Enviada automaticamente algumas horas antes do atendimento
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">
                        Notificação de Reagendamento
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                        Enviada quando você altera a data ou horário de um agendamento
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Incluídas */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Informações nas Mensagens
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: '📅', text: 'Data e dia da semana' },
                    { icon: '🕐', text: 'Horário do atendimento' },
                    { icon: '✂️', text: 'Serviço agendado' },
                    { icon: '👤', text: 'Nome do cliente' },
                    { icon: '🏪', text: 'Nome da barbearia' },
                    { icon: '💬', text: 'Mensagem personalizada' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dica */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    <strong>Dica:</strong> Personalize suas mensagens na seção "Personalização de Mensagens" acima para deixá-las com a cara da sua barbearia!
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppSettings;