import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, TrendingUp, ExternalLink, AlertCircle, Eye, SquarePen, Trash2, Phone, Plus, Scissors, CalendarCheck, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { format, parseISO, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
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
import { FitInAppointmentForm } from "@/components/FitInAppointmentForm";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, barbershop, services, loading: userLoading, error: userError, refetch: refetchUser } = useUserData();
  const { stats, todayAppointments, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData(barbershop?.id);
  
  const { toast } = useToast();
  
  // Estados para o modal e ações
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notesUpdateLoading, setNotesUpdateLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  
  // Estados para novo agendamento
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isFitIn, setIsFitIn] = useState(false);
  const [isFitInMode, setIsFitInMode] = useState(false);
  
  // Estados para busca de clientes
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  
  // Estados para calendário
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarAppointments, setCalendarAppointments] = useState<any[]>([]);
  
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
            services (name, duration)
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
            service_duration: apt.services?.duration
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
  
  const updateAppointmentStatus = async (newStatus) => {
    if (!selectedAppointment) return;
    
    setStatusUpdateLoading(true);
    try {
      // Buscar dados completos do agendamento antes de atualizar
      const { data: appointmentData, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration),
          barbershop:barbershops(slug, name)
        `)
        .eq("id", selectedAppointment.id)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar status
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", selectedAppointment.id);
      
      if (error) throw error;

      // Se foi cancelado, enviar mensagem WhatsApp
      if (newStatus === 'cancelled' && appointmentData) {
        try {
          const serviceName = appointmentData.service?.name || 'Serviço';
          const barbershopSlug = appointmentData.barbershop?.slug || '';

          // Enviar via WhatsApp com link da barbearia
          const { enviarCancelamentoWhatsApp } = await import('@/lib/notifications');
          await enviarCancelamentoWhatsApp({
            barbershopId: appointmentData.barbershop_id,
            barbershopSlug: barbershopSlug,
            customerName: appointmentData.customer_name,
            customerPhone: appointmentData.customer_phone,
            scheduledAt: appointmentData.scheduled_at,
            serviceName: serviceName,
          });
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          // Não falhar se WhatsApp der erro
        }
      }
      
      // Atualizar o agendamento localmente
      selectedAppointment.status = newStatus;
      refetchDashboard();

      // Feedback de sucesso
      const { showToast } = await import('@/lib/toast-helper');
      if (newStatus === 'cancelled') {
        showToast.info('Agendamento cancelado', 'O cliente foi notificado via WhatsApp.');
      } else if (newStatus === 'confirmed') {
        showToast.success('Agendamento confirmado', 'Status atualizado com sucesso.');
      } else {
        showToast.success('Status atualizado', 'O status foi alterado com sucesso.');
      }
      
    } catch (error) {
      const { showToast } = await import('@/lib/toast-helper');
      showToast.error('Erro ao atualizar', 'Não foi possível atualizar o status.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  const updateAppointmentNotes = async (notes) => {
    if (!selectedAppointment) return;
    
    setNotesUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ notes })
        .eq('id', selectedAppointment.id);
      
      if (error) throw error;
      
      // Atualizar o agendamento localmente
      selectedAppointment.notes = notes;
      refetchDashboard();

      // Feedback de sucesso
      const { showToast } = await import('@/lib/toast-helper');
      showToast.success('Observações atualizadas', 'As observações foram salvas com sucesso.');
      
    } catch (error) {
      const { showToast } = await import('@/lib/toast-helper');
      showToast.error('Erro ao atualizar', 'Não foi possível atualizar as observações.');
    } finally {
      setNotesUpdateLoading(false);
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

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !editDate || !editTime) return;
    setRescheduleLoading(true);
    try {
      // Monta a data/hora com fuso -03:00 e salva em ISO
      const scheduledAt = new Date(`${editDate}T${editTime}:00-03:00`);
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: scheduledAt.toISOString() })
        .eq("id", selectedAppointment.id);
      if (error) throw error;
      // Atualiza visualmente
      selectedAppointment.scheduled_at = scheduledAt.toISOString();
      refetchDashboard();
      alert("Agendamento atualizado com sucesso.");
    } catch (error) {
      alert("Erro ao reagendar agendamento.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Funções para novo agendamento
  const openNewAppointmentModal = () => {
    setNewAppointmentOpen(true);
    setSelectedDate(new Date());
  };

  const closeNewAppointmentModal = () => {
    setNewAppointmentOpen(false);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setCustomerSearchTerm("");
    setTimeSlots([]);
    setIsFitIn(false);
    setIsFitInMode(false);
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

  // Carregar horários disponíveis quando serviço ou data mudam
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!barbershop || !selectedService || !selectedDate) return;
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const slots = await getAvailableTimeSlots(barbershop.id, selectedService, dateString);
        setTimeSlots(slots);
        setSelectedTime(null);
      } catch (error) {
        setTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [barbershop, selectedService, selectedDate]);

  // Atualização em tempo real dos horários
  useEffect(() => {
    if (!barbershop || !selectedService || !selectedDate) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    const refreshSlots = async () => {
      try {
        const slots = await getAvailableTimeSlots(barbershop.id, selectedService, dateString);
        setTimeSlots(slots);
      } catch (error) {
        // Erro silenciado
      }
    };

    const channel = supabase.channel('realtime-appointments-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${barbershop.id}`,
        },
        () => {
          refreshSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershop, selectedService, selectedDate]);

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
      
      console.log('Dados do agendamento:', {
        barbershop_id: barbershop.id,
        service_id: data.service_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: true
      });
      
      await createAppointment({
        barbershop_id: barbershop.id,
        service_id: data.service_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: true
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
      refetchDashboard();
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

  const handleNewAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTime || !customerName || !customerPhone || !barbershop || !selectedService || !selectedDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const scheduledAt = `${dateString}T${selectedTime}:00-03:00`;
      
      await createAppointment({
        barbershop_id: barbershop.id,
        service_id: selectedService,
        customer_name: customerName,
        customer_phone: customerPhone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: isFitIn
      });

      // Enviar mensagem de confirmação via WhatsApp
      try {
        const serviceName = services.find(s => s.id === selectedService)?.name || 'Serviço';
        const { enviarLembreteWhatsApp } = await import('@/lib/notifications');
        
        const mensagemEnviada = await enviarLembreteWhatsApp({
          barbershopId: barbershop.id,
          customerName,
          customerPhone,
          scheduledAt,
          serviceName,
          tipo: 'confirmacao',
        });

        toast({
          title: "Agendamento Criado! 📅",
          description: mensagemEnviada 
            ? `Horário reservado e confirmação enviada via WhatsApp.`
            : `Horário reservado para ${selectedTime} do dia ${selectedDate.toLocaleDateString('pt-BR')}.`,
        });
      } catch (whatsappError) {
        toast({
          title: "Agendamento Criado! 📅",
          description: `Horário reservado para ${selectedTime} do dia ${selectedDate.toLocaleDateString('pt-BR')}.`,
        });
      }

      closeNewAppointmentModal();
      refetchDashboard();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Bem-vindo de volta!"
      action={
        <Button asChild>
          <Link to={`/barbershop/${barbershop.slug}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Meu Site
          </Link>
        </Button>
      }
    >
      <div className="space-y-6 md:space-y-8">
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
              <DayCalendar
                appointments={calendarAppointments.map(apt => ({
                  id: apt.id,
                  customer_name: apt.customer_name,
                  customer_phone: apt.customer_phone,
                  scheduled_at: apt.scheduled_at,
                  status: apt.status as "pending" | "confirmed" | "cancelled",
                  service_name: apt.service_name,
                  service_duration: apt.service_duration
                }))}
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
      <Dialog open={newAppointmentOpen} onOpenChange={setNewAppointmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              {isFitInMode ? "Novo Encaixe" : "Novo Agendamento"}
            </DialogTitle>
            <DialogDescription>
              {isFitInMode ? "Crie um agendamento sem restrições de horário" : "Crie um agendamento rápido para seu cliente"}
            </DialogDescription>
          </DialogHeader>

          {/* Toggle Modo Encaixe */}
          <div className="relative overflow-hidden rounded-lg border-2 border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <Label
                    htmlFor="fit_in_toggle_dashboard"
                    className="text-sm font-semibold text-white cursor-pointer"
                  >
                    Modo Encaixe
                  </Label>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ative para agendar sem restrições de horário. Você define manualmente início e fim.
                </p>
              </div>
              <Switch
                id="fit_in_toggle_dashboard"
                checked={isFitInMode}
                onCheckedChange={setIsFitInMode}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          {/* Formulário de Encaixe */}
          {isFitInMode ? (
            <FitInAppointmentForm
              services={services}
              customers={customers}
              onSubmit={handleFitInSubmitDashboard}
              onCancel={closeNewAppointmentModal}
              loading={submitting}
            />
          ) : (
            <form onSubmit={handleNewAppointmentSubmit} className="space-y-6">
            {/* Informações do Cliente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Dados do Cliente</h3>
              </div>
              
              {/* Busca de Cliente */}
              <div>
                <Label htmlFor="customer_search">Buscar Cliente Existente</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    if (value === "new") {
                      setCustomerName("");
                      setCustomerPhone("");
                    } else {
                      const customer = customers.find(c => c.id === value);
                      if (customer) {
                        setCustomerName(customer.name);
                        setCustomerPhone(customer.phone);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um cliente ou digite novo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Novo Cliente</span>
                      </div>
                    </SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-col gap-1">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">({customer.phone})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Nome Completo</Label>
                  <Input
                    id="customer_name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">WhatsApp</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Seleção de Serviço */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold">Escolha o Serviço</h3>
              </div>
              <Select value={selectedService || ""} onValueChange={setSelectedService} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Seleção de Data */}
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">Selecione a Data</h3>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-background/50">
                  <WeeklyDatePicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    minDate={new Date()}
                  />
                </div>
              </motion.div>
            )}

            {/* Seleção de Horário */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">Escolha o Horário</h3>
                </div>
                
                {timeSlots.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-muted/30 border border-dashed border-border">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum horário disponível para esta data.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Tente selecionar outra data
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {timeSlots.map((slot, index) => (
                      <motion.div
                        key={slot.time}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Button
                          type="button"
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`w-full h-12 text-sm font-semibold transition-all ${
                            selectedTime === slot.time 
                              ? "shadow-lg shadow-primary/30 scale-105" 
                              : "hover:scale-105 hover:shadow-md"
                          } ${
                            !slot.available 
                              ? "opacity-30 cursor-not-allowed hover:scale-100" 
                              : ""
                          }`}
                        >
                          {slot.time}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Resumo */}
            {selectedTime && selectedDate && selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                      Resumo do Agendamento
                    </p>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                      <p><strong>Cliente:</strong> {customerName || "..."}</p>
                      <p><strong>Serviço:</strong> {services.find(s => s.id === selectedService)?.name}</p>
                      <p><strong>Data:</strong> {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p><strong>Horário:</strong> {selectedTime}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button"
                variant="outline" 
                onClick={closeNewAppointmentModal}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={!selectedTime || !customerName || !customerPhone || submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Agendamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Otimizado Mobile */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Info Cards Compactos */}
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
                  <p className="font-semibold">{selectedAppointment.customer_name}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <a 
                    href={`tel:${selectedAppointment.customer_phone}`} 
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {selectedAppointment.customer_phone}
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <Input 
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mt-1 h-11 text-base w-full"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground">Horário</Label>
                    <Input 
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="mt-1 h-11 text-base w-full"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Serviço</Label>
                  <p className="font-semibold text-sm">{selectedAppointment.service_name}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select 
                  value={selectedAppointment.status} 
                  onValueChange={updateAppointmentStatus}
                  disabled={statusUpdateLoading}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Textarea 
                  placeholder="Adicione observações..."
                  defaultValue={selectedAppointment.notes || ''}
                  onBlur={(e) => updateAppointmentNotes(e.target.value)}
                  disabled={notesUpdateLoading}
                  className="mt-1 text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={closeViewModal}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Fechar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto order-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
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
              onClick={rescheduleAppointment} 
              disabled={rescheduleLoading}
              className="w-full sm:w-auto order-1 sm:order-3"
            >
              {rescheduleLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
