import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { MessageCircle, CheckCircle, Clock, Sparkles, Copy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageCustomizerProps {
  barbershopId: string;
  planType?: string;
}

const MessageCustomizer = ({ barbershopId, planType }: MessageCustomizerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Verificar se é plano PRO
  const isPro = planType === 'pro';
  
  // Debug: verificar plano
  useEffect(() => {
    console.log('=== MessageCustomizer Debug ===');
    console.log('planType recebido:', planType);
    console.log('isPro calculado:', isPro);
    console.log('Tipo de planType:', typeof planType);
    console.log('================================');
  }, [planType, isPro]);

  // Mensagens
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');

  // Mensagens padrão
  const defaultMessages = {
    confirmation: `Olá {{primeiro_nome}}! ✅

Seu agendamento foi confirmado com sucesso!

👤 Barbeiro: {{barbeiro}}
📅 Data: {{data}}
🕐 Horário: {{hora}}
✂️ Serviço: {{servico}}
🏪 Local: {{barbearia}}

{{barbeiro}} te espera! Nos vemos em breve! 💈`,
    
    reschedule: `Olá {{primeiro_nome}}! 🔄

Seu agendamento foi reagendado:

👤 Barbeiro: {{barbeiro}}
📅 Nova Data: {{data}}
🕐 Novo Horário: {{hora}}
✂️ Serviço: {{servico}}

{{barbeiro}} te espera no novo horário! 💈`,
    
    reminder: `Olá {{primeiro_nome}}! ⏰

Lembrete: você tem um agendamento hoje!

👤 Com: {{barbeiro}}
🕐 Horário: {{hora}}
✂️ Serviço: {{servico}}
🏪 Local: {{barbearia}}

{{barbeiro}} está te esperando! ✂️`
  };

  // Dados fictícios para preview
  const previewData = {
    primeiro_nome: 'João',
    barbeiro: 'Carlos Silva',
    servico: 'Corte + Barba',
    data: '15/11/2024',
    hora: '14:30',
    barbearia: 'Barbearia Premium'
  };

  // Carregar mensagens salvas
  useEffect(() => {
    loadMessages();
  }, [barbershopId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbershops')
        .select('confirmation_message, reschedule_message, reminder_message')
        .eq('id', barbershopId)
        .single();

      if (error) throw error;

      setConfirmationMessage(data.confirmation_message || defaultMessages.confirmation);
      setRescheduleMessage(data.reschedule_message || defaultMessages.reschedule);
      setReminderMessage(data.reminder_message || defaultMessages.reminder);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMessages = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('barbershops')
        .update({
          confirmation_message: confirmationMessage,
          reschedule_message: rescheduleMessage,
          reminder_message: reminderMessage,
        })
        .eq('id', barbershopId);

      if (error) throw error;

      toast({
        title: 'Mensagens salvas! ✅',
        description: 'Suas personalizações foram aplicadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as mensagens. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPreview = (message: string) => {
    return message
      .replace(/{{primeiro_nome}}/g, previewData.primeiro_nome)
      .replace(/{{barbeiro}}/g, previewData.barbeiro)
      .replace(/{{servico}}/g, previewData.servico)
      .replace(/{{data}}/g, previewData.data)
      .replace(/{{hora}}/g, previewData.hora)
      .replace(/{{barbearia}}/g, previewData.barbearia);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast({
      title: 'Variável copiada! 📋',
      description: `{{${variable}}} foi copiada para a área de transferência.`,
    });
  };

  const resetToDefault = (type: 'confirmation' | 'reschedule' | 'reminder') => {
    switch (type) {
      case 'confirmation':
        setConfirmationMessage(defaultMessages.confirmation);
        break;
      case 'reschedule':
        setRescheduleMessage(defaultMessages.reschedule);
        break;
      case 'reminder':
        setReminderMessage(defaultMessages.reminder);
        break;
    }
    toast({
      title: 'Mensagem restaurada',
      description: 'A mensagem padrão foi restaurada.',
    });
  };

  const VariableButton = ({ 
    variable, 
    label, 
    isPro: isProVar 
  }: { 
    variable: string; 
    label: string; 
    isPro?: boolean 
  }) => {
    const showProBadge = isProVar && isPro;
    
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => copyVariable(variable)}
        className={`text-xs hover:bg-primary/10 hover:border-primary/50 transition-all ${
          showProBadge ? 'border-amber-500/50 bg-amber-500/5 font-semibold' : ''
        }`}
      >
        <Copy className="h-3 w-3 mr-1" />
        {label}
        {showProBadge && (
          <span className="ml-1.5 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
            PRO
          </span>
        )}
      </Button>
    );
  };

  const MessageEditor = ({
    title,
    description,
    icon: Icon,
    value,
    onChange,
    type,
    color
  }: {
    title: string;
    description: string;
    icon: any;
    value: string;
    onChange: (value: string) => void;
    type: 'confirmation' | 'reschedule' | 'reminder';
    color: string;
  }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => resetToDefault(type)}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Restaurar padrão
        </Button>
      </div>

      {/* Variables */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Variáveis disponíveis (clique para copiar)
        </Label>
        
        {/* Badges de variáveis */}
        <div className="flex flex-wrap gap-2">
          <VariableButton variable="primeiro_nome" label="Nome" isPro={false} />
          <VariableButton variable="data" label="Data" isPro={false} />
          <VariableButton variable="hora" label="Hora" isPro={false} />
          <VariableButton variable="servico" label="Serviço" isPro={false} />
          <VariableButton variable="barbeiro" label="Barbeiro" isPro={true} />
          <VariableButton variable="barbearia" label="Barbearia" isPro={false} />
        </div>
        
        {/* Explicação sobre variável barbeiro */}
        {isPro ? (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
              <span className="text-base shrink-0">👑</span>
              <span>
                <strong>Recurso PRO Ativo:</strong> A variável {'{{barbeiro}}'} mostrará o nome do profissional específico que atenderá o cliente. Perfeito para barbearias com múltiplos barbeiros!
              </span>
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-base shrink-0">ℹ️</span>
              <span>
                A variável {'{{barbeiro}}'} mostrará "Qualquer barbeiro disponível" no plano atual. 
                <strong className="text-foreground"> Faça upgrade para PRO</strong> para mostrar o nome específico de cada barbeiro.
              </span>
            </p>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          💡 Cole as variáveis na mensagem usando Ctrl+V ou clicando nos botões acima
        </p>
      </div>

      {/* Editor and Preview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <Label htmlFor={`message-${type}`}>Sua Mensagem</Label>
          <Textarea
            id={`message-${type}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua mensagem personalizada..."
            className="min-h-[300px] font-mono text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            ✨ Use emojis e quebras de linha livremente
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview (como o cliente verá)</Label>
          <div className="min-h-[300px] p-4 rounded-lg bg-muted/30 border border-border">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-xs font-medium text-green-600">WhatsApp</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {formatPreview(value) || 'Digite uma mensagem para ver o preview...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Carregando mensagens...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageCircle className="h-6 w-6 text-primary" />
            Personalização de Mensagens
          </CardTitle>
          <CardDescription>
            Customize as mensagens automáticas enviadas aos seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="confirmation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="confirmation" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
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

            <TabsContent value="confirmation">
              <MessageEditor
                title="Mensagem de Confirmação"
                description="Enviada imediatamente após o cliente agendar"
                icon={CheckCircle}
                value={confirmationMessage}
                onChange={setConfirmationMessage}
                type="confirmation"
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
            </TabsContent>

            <TabsContent value="reschedule">
              <MessageEditor
                title="Mensagem de Reagendamento"
                description="Enviada quando um agendamento é alterado"
                icon={RotateCcw}
                value={rescheduleMessage}
                onChange={setRescheduleMessage}
                type="reschedule"
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
            </TabsContent>

            <TabsContent value="reminder">
              <MessageEditor
                title="Mensagem de Lembrete"
                description="Enviada antes do horário agendado"
                icon={Clock}
                value={reminderMessage}
                onChange={setReminderMessage}
                type="reminder"
                color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={saveMessages}
              disabled={saving}
              size="lg"
              className="min-w-[200px]"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Mensagens
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MessageCustomizer;
