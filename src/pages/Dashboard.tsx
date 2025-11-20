import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, TrendingUp, ExternalLink, AlertCircle, Eye, SquarePen, Trash2, Phone, Plus, Scissors, CalendarCheck, Zap, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { format, parseISO, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { enviarLembreteWhatsApp } from "@/lib/notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getAvailableTimeSlots, createAppointment } from "@/lib/supabase-queries";
import { motion } from "framer-motion";
import WeeklyDatePicker from "@/components/WeeklyDatePicker";
import { DayCalendar } from "@/components/DayCalendar";
import { MultiBarberCalendar } from "@/components/MultiBarberCalendar";
import { FitInAppointmentForm } from "@/components/FitInAppointmentForm";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, barbershop, services, loading: userLoading, error: userError, refetch: refetchUser } = useUserData();
  const { stats, todayAppointments, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData(barbershop?.id);
  const planLimits = usePlanLimits(barbershop);
  
  const { toast } = useToast();
  
  // Estados para o modal e ações
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notesUpdateLoading, setNotesUpdateLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  
  // Estado para modal de novo agendamento
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  
  // Estados para calendário
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarAppointments, setCalendarAppointments] = useState<any[]>([]);
  
  // Estados para novo agendamento com horário pré-selecionado
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Estados para modal de novo agendamento
  const [customers, setCustomers] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Buscar agendamentos do dia selecionado
  useEffect(() => {
    let mounted = true;
    
    const fetchCalendarAppointments = async () => {
      if (!barbershop?.id || !mounted) return;
      
      try {
        const startOfDay = new Date(calendarDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(calendarDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            services (name, duration),
            barbers (id, name)
          `)
          .eq("barbershop_id", barbershop.id)
          .gte("scheduled_at", startOfDay.toISOString())
          .lte("scheduled_at", endOfDay.toISOString())
          .order("scheduled_at", { ascending: true });
        
        if (error) throw error;
        
        if (mounted) {
          setCalendarAppointments(data?.map(apt => ({
            ...apt,
            service_name: apt.services?.name,
            service_duration: apt.services?.duration,
            barber_id: apt.barbers?.id,
            barber_name: apt.barbers?.name
          })) || []);
        }
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        if (mounted) {
          setCalendarAppointments([]);
        }
      }
    };
    
    fetchCalendarAppointments();
    
    return () => {
      mounted = false;
    };
  }, [barbershop?.id, calendarDate]);
  
  // Dashboard render tracking removed for production
  
  // Funções para gerenciar o modal e ações
  const openViewModal = (appointment) => {
    setSelectedAppointment(appointment);
    // Inicializa campos de edição com a data/hora atuais do agendamento
    try {
      const iso = appointment.scheduled_at;
      setEditDate(format(parseISO(iso), "yyyy-MM-dd"));
      setEditTime(format(parseISO(iso), "HH:mm"));
    } catch (e) {
      // fallback simples caso o parse falhe
      const d = new Date(appointment.scheduled_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      setEditDate(`${yyyy}-${mm}-${dd}`);
      setEditTime(`${hh}:${mi}`);
    }
    setViewModalOpen(true);
  };
  
  const closeViewModal = () => {
    setSelectedAppointment(null);
    setViewModalOpen(false);
  };
  
  // Função para salvar todas as alterações (status e data/hora)
  const saveAllChanges = async () => {
    if (!selectedAppointment || !editDate || !editTime) return;
    
    setRescheduleLoading(true);
    try {
      // Buscar dados originais do banco para comparar
      const { data: originalData, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration),
          barbershop:barbershops(slug, name)
        `)
        .eq("id", selectedAppointment.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar dados originais:', fetchError);
        throw fetchError;
      }

      // Preparar dados para atualização
      const scheduledAt = new Date(`${editDate}T${editTime}:00-03:00`);
      const statusChanged = originalData.status !== selectedAppointment.status;
      const newStatus = selectedAppointment.status;

      // Atualizar no banco (sem notes, pois a coluna não existe)
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: newStatus,
          scheduled_at: scheduledAt.toISOString()
        })
        .eq("id", selectedAppointment.id);
      
      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw error;
      }

      // Enviar mensagens WhatsApp baseado na mudança de status
      if (statusChanged && originalData) {
        const serviceName = originalData.service?.name || 'Serviço';
        const barbershopSlug = originalData.barbershop?.slug || '';

        try {
          if (newStatus === 'cancelled') {
            // Enviar mensagem de cancelamento
            const { enviarCancelamentoWhatsApp } = await import('@/lib/notifications');
            await enviarCancelamentoWhatsApp({
              barbershopId: originalData.barbershop_id,
              barbershopSlug: barbershopSlug,
              customerName: originalData.customer_name,
              customerPhone: originalData.customer_phone,
              scheduledAt: scheduledAt.toISOString(),
              serviceName: serviceName,
            });

            const { showToast } = await import('@/lib/toast-helper');
            showToast.info('Alterações salvas', 'Agendamento cancelado e cliente notificado via WhatsApp.');
          } else if (newStatus === 'confirmed') {
            // Enviar mensagem de confirmação
            const { enviarLembreteWhatsApp } = await import('@/lib/notifications');
            await enviarLembreteWhatsApp({
              barbershopId: originalData.barbershop_id,
              customerName: originalData.customer_name,
              customerPhone: originalData.customer_phone,
              scheduledAt: scheduledAt.toISOString(),
              serviceName: serviceName,
              tipo: 'confirmacao',
            });

            const { showToast } = await import('@/lib/toast-helper');
            showToast.success('Alterações salvas', 'Agendamento confirmado e cliente notificado via WhatsApp.');
          } else {
            // Status mudou para pendente ou outro
            const { showToast } = await import('@/lib/toast-helper');
            showToast.success('Alterações salvas', 'Todas as alterações foram salvas com sucesso.');
          }
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          const { showToast } = await import('@/lib/toast-helper');
          showToast.success('Alterações salvas', 'Status atualizado, mas não foi possível enviar WhatsApp.');
        }
      } else {
        // Sem mudança de status, apenas alterações de data/hora
        const { showToast } = await import('@/lib/toast-helper');
        showToast.success('Alterações salvas', 'Todas as alterações foram salvas com sucesso.');
      }

      refetchDashboard();
      closeViewModal();
      
    } catch (error) {
      console.error('Erro geral ao salvar:', error);
      const { showToast } = await import('@/lib/toast-helper');
      showToast.error('Erro ao salvar', 'Não foi possível salvar as alterações.');
    } finally {
      setRescheduleLoading(false);
    }
  };
  
  const deleteAppointment = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;

      // Importar dinamicamente o toast helper
      const { showToast } = await import('@/lib/toast-helper');
      showToast.success('Agendamento excluído', 'O agendamento foi removido com sucesso.');
      
      refetchDashboard();
      closeViewModal();
      
    } catch (error) {
      // Importar dinamicamente o toast helper
      const { showToast } = await import('@/lib/toast-helper');
      showToast.error('Erro ao excluir', 'Não foi possível excluir o agendamento.');
    }
  };



  // Função para abrir modal de novo agendamento
  const openNewAppointmentModal = () => {
    setNewAppointmentOpen(true);
  };
  
  // Função para fechar modal de novo agendamento
  const closeNewAppointmentModal = () => {
    setNewAppointmentOpen(false);
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedBarberId("");
  };

  // Buscar clientes quando o modal abre
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!barbershop?.id || !newAppointmentOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('barbershop_id', barbershop.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        // Erro silenciado
      }
    };

    fetchCustomers();
  }, [barbershop?.id, newAppointmentOpen]);

  // Buscar barbeiros quando o modal abre (PRO feature)
  useEffect(() => {
    const fetchBarbers = async () => {
      if (!barbershop?.id || !newAppointmentOpen || !planLimits.features.multipleBarbers) return;
      
      setLoadingBarbers(true);
      try {
        const { data, error } = await supabase
          .from('barbers')
          .select('id, name, photo_url, specialties, is_active')
          .eq('barbershop_id', barbershop.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setBarbers(data || []);
        
        // Se houver apenas um barbeiro, selecionar automaticamente
        if (data && data.length === 1) {
          setSelectedBarberId(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, [barbershop?.id, newAppointmentOpen, planLimits.features.multipleBarbers]);

  const handleFitInSubmitDashboard = async (data: {
    customer_name: string;
    customer_phone: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    service_id: string;
  }) => {
    console.log('Dashboard - handleFitInSubmitDashboard chamado com dados:', data);
    
    if (!barbershop?.id) {
      console.error('Barbearia não encontrada');
      toast({
        title: "Erro",
        description: "Barbearia não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Iniciando criação de encaixe no Dashboard...');
      
      // Converter dd/MM/yyyy -> yyyy-MM-dd
      const parsedDate = parse(data.scheduled_date, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        console.error('Data inválida:', data.scheduled_date);
        toast({
          title: "Data inválida",
          description: "Use o formato dd/MM/yyyy.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      const isoDate = format(parsedDate, 'yyyy-MM-dd');
      const scheduledAt = `${isoDate}T${data.start_time}:00-03:00`;
      
      // Determinar o barbeiro a ser atribuído
      let finalBarberId = selectedBarberId;
      
      // Se "Qualquer Barbeiro" foi selecionado e é plano PRO, encontrar o melhor barbeiro
      if (!selectedBarberId && planLimits.features.multipleBarbers) {
        const serviceDuration = services.find(s => s.id === data.service_id)?.duration || 30;
        const { findBestAvailableBarber } = await import('@/lib/barber-scheduler');
        
        const bestBarberId = await findBestAvailableBarber(
          barbershop.id,
          data.service_id,
          scheduledAt,
          serviceDuration
        );
        
        if (bestBarberId) {
          finalBarberId = bestBarberId;
          console.log('[Dashboard FitIn] Barbeiro automaticamente atribuído:', bestBarberId);
        }
      }
      
      console.log('Dados do agendamento:', {
        barbershop_id: barbershop.id,
        service_id: data.service_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: true,
        barber_id: finalBarberId
      });
      
      await createAppointment({
        barbershop_id: barbershop.id,
        service_id: data.service_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: true,
        ...(finalBarberId && { barber_id: finalBarberId })
      });
      
      console.log('Encaixe criado com sucesso');

      // Enviar mensagem de confirmação via WhatsApp
      try {
        const serviceName = services.find(s => s.id === data.service_id)?.name || 'Serviço';
        
        const mensagemEnviada = await enviarLembreteWhatsApp({
          barbershopId: barbershop.id,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          scheduledAt,
          serviceName,
          tipo: 'confirmacao',
        });

        toast({
          title: "Encaixe Criado! ⚡",
          description: mensagemEnviada 
            ? "Encaixe criado e confirmação enviada via WhatsApp."
            : "Encaixe criado com sucesso!",
        });
      } catch (whatsappError) {
        toast({
          title: "Sucesso",
          description: "Encaixe criado com sucesso!",
        });
      }

      closeNewAppointmentModal();
      // Aguardar e forçar atualização
      setTimeout(() => {
        refetchDashboard();
      }, 300);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o encaixe.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Função removida - agora usa NewAppointmentModal

  // Se autenticacao finalizou e não há usuário, redireciona para login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Timeout de segurança - força renderização após 3 segundos
  const [forceRender, setForceRender] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceRender(true);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  if (authLoading && !forceRender) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if ((userLoading || dashboardLoading) && !forceRender) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (userError || dashboardError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar dados</h1>
          <p className="text-muted-foreground mb-4">{userError || dashboardError}</p>
          <Button onClick={() => {
            if (userError) refetchUser();
            if (dashboardError) refetchDashboard();
          }}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  if (!barbershop && !forceRender) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            Parece que sua barbearia ainda não foi configurada. Entre em contato com o suporte.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Se forceRender está ativo mas não tem barbershop, mostrar mensagem inline
  if (!barbershop && forceRender) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Configuração Necessária"
      >
        <Card className="border-2 border-yellow-500">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Barbearia não configurada</h2>
              <p className="text-muted-foreground mb-4">
                Configure sua barbearia para começar a usar o sistema.
              </p>
              <Button asChild>
                <Link to="/dashboard/barbershop">Configurar Agora</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Função para copiar link
  const copyBarbershopLink = async () => {
    const link = `${window.location.origin}/barbershop/${barbershop.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "O link da sua barbearia foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Bem-vindo de volta!"
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyBarbershopLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Link
          </Button>
          <Button asChild>
            <Link to={`/barbershop/${barbershop.slug}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Meu Site
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 md:space-y-8">
        {/* Banner Grupo de Clientes - Responsivo */}
        <motion.a
          href="https://chat.whatsapp.com/HqObbcQZfwn9voifcWlAHV"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="block w-full rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
        >
          {/* Banner Mobile */}
          <img 
            src="/banner-grupo-clientes.png" 
            alt="Entre no Grupo de Clientes ZapCorte no WhatsApp" 
            className="w-full h-auto md:hidden"
          />
          {/* Banner Desktop */}
          <img 
            src="/midia/banner-grupo-desktop.png" 
            alt="Entre no Grupo de Clientes ZapCorte no WhatsApp" 
            className="w-full h-auto hidden md:block"
          />
        </motion.a>

        {/* Atalhos Rápidos Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 grid-cols-1 md:grid-cols-3"
        >
          {/* Novo Agendamento */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-xl bg-gradient-to-br from-primary/5 to-primary/10"
              onClick={openNewAppointmentModal}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Novo Agendamento</h3>
                    <p className="text-sm text-muted-foreground">Criar agendamento rápido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ver Agendamentos */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer border-2 hover:border-blue-500 transition-all hover:shadow-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10"
              onClick={() => navigate('/appointments')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <CalendarCheck className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Ver Agendamentos</h3>
                    <p className="text-sm text-muted-foreground">Gerenciar todos os horários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Meus Serviços */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer border-2 hover:border-purple-500 transition-all hover:shadow-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10"
              onClick={() => navigate('/services')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Scissors className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Meus Serviços</h3>
                    <p className="text-sm text-muted-foreground">Gerenciar serviços</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Stats - Grid 2x2 Mobile */}
        <div className="stats-grid grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          <Card className="stats-card border-2">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stats.todayAppointments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Este Mês</p>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stats.monthAppointments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Serviços</p>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalServices}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Plano</p>
                  <User className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                </div>
                <p className="text-lg sm:text-xl font-bold capitalize">{stats.planType}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda de Hoje - Estilo Apple Calendar */}
        <Card className="border-2">
          <CardContent className="p-0">
            <div className="h-[700px]">
              {planLimits.features.multipleBarbers ? (
                <MultiBarberCalendar
                  appointments={calendarAppointments.map(apt => ({
                    id: apt.id,
                    customer_name: apt.customer_name,
                    customer_phone: apt.customer_phone,
                    scheduled_at: apt.scheduled_at,
                    status: apt.status as "pending" | "confirmed" | "cancelled",
                    service_name: apt.service_name,
                    service_duration: apt.service_duration,
                    barber_id: apt.barber_id,
                    barber_name: apt.barber_name
                  }))}
                  barbershopId={barbershop.id}
                  onAppointmentClick={(appointment) => {
                    const fullAppointment = calendarAppointments.find(apt => apt.id === appointment.id);
                    if (fullAppointment) {
                      openViewModal(fullAppointment);
                    }
                  }}
                  onTimeSlotClick={(time, barberId) => {
                    setSelectedDate(calendarDate);
                    setSelectedTime(time);
                    setNewAppointmentOpen(true);
                  }}
                  onDateChange={(date) => {
                    setCalendarDate(date);
                  }}
                />
              ) : (
                <DayCalendar
                  appointments={calendarAppointments.map(apt => ({
                    id: apt.id,
                    customer_name: apt.customer_name,
                    customer_phone: apt.customer_phone,
                    scheduled_at: apt.scheduled_at,
                    status: apt.status as "pending" | "confirmed" | "cancelled",
                    service_name: apt.service_name,
                    service_duration: apt.service_duration,
                    barber_name: apt.barber_name
                  }))}
                  showBarber={false}
                  onAppointmentClick={(appointment) => {
                    const fullAppointment = calendarAppointments.find(apt => apt.id === appointment.id);
                    if (fullAppointment) {
                      openViewModal(fullAppointment);
                    }
                  }}
                  onTimeSlotClick={(time) => {
                    setSelectedDate(calendarDate);
                    setSelectedTime(time);
                    setNewAppointmentOpen(true);
                  }}
                  onDateChange={(date) => {
                    setCalendarDate(date);
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Info */}
        {barbershop.plan_type === "freemium" && (
          <div className="space-y-4">
            {/* Limites de Serviços */}
            <Card className={`border-2 ${stats.planLimits?.currentServices >= stats.planLimits?.maxServices ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-900/90'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-white">
                      Serviços Cadastrados
                    </h3>
                    <p className="text-sm text-gray-300">
                      {stats.planLimits?.currentServices} de {stats.planLimits?.maxServices} serviços cadastrados
                    </p>
                    {!stats.planLimits?.canCreateService && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Limite de serviços atingido! Faça upgrade para adicionar mais.
                      </p>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    variant={stats.planLimits?.canCreateService ? "default" : "destructive"}
                    disabled={!stats.planLimits?.canCreateService}
                    asChild
                  >
                    <Link to="/plan">
                      Fazer Upgrade
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Modal de Novo Agendamento - Estilo Premium */}
      

      {/* Modal de Visualização - Design Minimalista Moderno */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100vh-2rem)] p-0 gap-0 overflow-hidden">
          {selectedAppointment && (
            <div className="flex flex-col h-full max-h-[calc(100vh-2rem)]">
              {/* Header Fixo */}
              <div className="flex-shrink-0 px-6 py-4 border-b">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl font-bold">Agendamento</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedAppointment.scheduled_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </DialogHeader>
              </div>

              {/* Conteúdo Scrollável */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {/* Cliente e Telefone - Cards Lado a Lado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm truncate">{selectedAppointment.customer_name}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</Label>
                      <a 
                        href={`tel:${selectedAppointment.customer_phone}`}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm text-primary truncate">{selectedAppointment.customer_phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Data e Horário - Inputs Modernos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</Label>
                      <Input 
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="h-11 text-base border-2"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horário</Label>
                      <Input 
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="h-11 text-base border-2"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Serviço */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serviço</Label>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Scissors className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium text-sm">{selectedAppointment.service_name}</p>
                    </div>
                  </div>

                  {/* Status - Select Moderno */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                    <Select 
                      value={selectedAppointment.status} 
                      onValueChange={(value) => {
                        // Atualizar apenas localmente
                        setSelectedAppointment({
                          ...selectedAppointment,
                          status: value as "pending" | "confirmed" | "cancelled"
                        });
                      }}
                      disabled={rescheduleLoading}
                    >
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Confirmado
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Cancelado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Footer Fixo - Ações */}
              <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/20">
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={closeViewModal}
                    className="flex-1 sm:flex-initial"
                  >
                    Fechar
                  </Button>
                  
                  <div className="flex gap-2 flex-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAppointment(selectedAppointment?.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      onClick={saveAllChanges} 
                      disabled={rescheduleLoading}
                      className="flex-1"
                    >
                      {rescheduleLoading ? (
                        <>
                          <div className="h-4 w-4 sm:mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="hidden sm:inline">Salvando...</span>
                        </>
                      ) : (
                        <>
                          <SquarePen className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Salvar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Agendamento */}
      <NewAppointmentModal
        open={newAppointmentOpen}
        onOpenChange={(open) => {
          setNewAppointmentOpen(open);
          if (!open) {
            closeNewAppointmentModal();
          }
        }}
        barbershopId={barbershop?.id || ""}
        services={services}
        onSuccess={refetchDashboard}
        isPro={planLimits.features.multipleBarbers}
        initialDate={selectedDate}
        initialTime={selectedTime}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
