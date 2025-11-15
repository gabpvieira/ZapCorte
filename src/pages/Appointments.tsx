import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Clock, Phone, User, Filter, Eye, RefreshCw, X, CheckCircle, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, parse, isPast, isToday, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { enviarLembreteWhatsApp } from "@/lib/notifications";
import { DatePicker } from "@/components/DatePicker";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  service_id: string;
  barbershop_id: string;
  created_at: string;
  service?: Service;
}

interface AppointmentFormData {
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  service_id: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer_name: "",
    customer_phone: "",
    scheduled_date: "",
    scheduled_time: "",
    service_id: "",
  });
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Estados para modal de visualização e ações
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notesUpdateLoading, setNotesUpdateLoading] = useState(false);
  const [acceptingAppointments, setAcceptingAppointments] = useState<Set<string>>(new Set());
  
  // Estados para reagendamento
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const { toast } = useToast();
  const { barbershop } = useUserData();

  useEffect(() => {
    if (barbershop?.id) {
      fetchAppointments();
      fetchServices();
      fetchCustomers();
    } else if (barbershop === null) {
      // Se barbershop é null (não undefined), significa que já foi carregado mas não existe
      setLoading(false);
    }
  }, [barbershop?.id, barbershop]);

  // Fallback: evitar loading infinito
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, [loading]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("barbershop_id", barbershop?.id);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      // Erro silenciado
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("barbershop_id", barbershop?.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      // Erro silenciado
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(id, name, price, duration)
        `)
        .eq("barbershop_id", barbershop?.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      customer_phone: "",
      scheduled_date: "",
      scheduled_time: "",
      service_id: "",
    });
    setSelectedCustomerId("");
    setEditingAppointment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barbershop?.id) {
      toast({
        title: "Erro",
        description: "Barbearia não encontrada.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      // Converter dd/MM/yyyy -> yyyy-MM-dd para compor ISO
      const parsedDate = parse(formData.scheduled_date, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        toast({
          title: "Data inválida",
          description: "Use o formato dd/MM/yyyy.",
          variant: "destructive",
        });
        return;
      }
      const isoDate = format(parsedDate, 'yyyy-MM-dd');
      const scheduledAt = new Date(`${isoDate}T${formData.scheduled_time}`);
      
      const appointmentData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        scheduled_at: scheduledAt.toISOString(),
        service_id: formData.service_id,
        barbershop_id: barbershop.id,
        status: "confirmed" as const, // Barbeiro cria já confirmado
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editingAppointment.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("appointments")
          .insert([appointmentData]);

        if (error) throw error;

        // Enviar mensagem de confirmação via WhatsApp
        try {
          const serviceName = services.find(s => s.id === formData.service_id)?.name || 'Serviço';
          
          const mensagemEnviada = await enviarLembreteWhatsApp({
            barbershopId: barbershop.id,
            customerName: formData.customer_name,
            customerPhone: formData.customer_phone,
            scheduledAt: scheduledAt.toISOString(),
            serviceName,
            tipo: 'confirmacao',
          });

          toast({
            title: "Agendamento Criado! 📅",
            description: mensagemEnviada 
              ? "Agendamento criado e confirmação enviada via WhatsApp."
              : "Agendamento criado com sucesso!",
          });
        } catch (whatsappError) {
          toast({
            title: "Sucesso",
            description: "Agendamento criado com sucesso!",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    const scheduledDate = new Date(appointment.scheduled_at);
    setFormData({
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      scheduled_date: format(scheduledDate, 'dd/MM/yyyy'),
      scheduled_time: scheduledDate.toTimeString().slice(0, 5),
      service_id: appointment.service_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (appointmentId: string) => {
    if (!appointmentId) {
      toast({
        title: "Erro",
        description: "ID do agendamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        console.error("Erro ao excluir agendamento:", error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      fetchAppointments();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      // Buscar dados completos do agendamento antes de atualizar
      const { data: appointmentData, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration),
          barbershop:barbershops(slug, name)
        `)
        .eq("id", appointmentId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar status
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

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

          toast({
            title: "Agendamento cancelado",
            description: "Cliente notificado via WhatsApp sobre o cancelamento.",
          });
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          // Não falhar se WhatsApp der erro
          toast({
            title: "Status atualizado",
            description: "Status atualizado, mas não foi possível enviar WhatsApp.",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Status atualizado com sucesso!",
        });
      }

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  // Funções auxiliares para formatação e validação
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: ptBR });
  };

  const getEndTime = (startTime: string, duration: number) => {
    const start = parseISO(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return format(end, "HH:mm", { locale: ptBR });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', variant: 'warning' as const };
      case 'confirmed':
        return { label: 'Confirmado', variant: 'default' as const };
      case 'cancelled':
        return { label: 'Cancelado', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'default' as const };
    }
  };

  const isPastAppointment = (dateString: string) => {
    return isPast(parseISO(dateString));
  };

  const canCancel = (appointment: Appointment) => {
    // Pode cancelar se não estiver cancelado e não for passado
    return appointment.status !== 'cancelled' && !isPastAppointment(appointment.scheduled_at);
  };

  const canReschedule = (appointment: Appointment) => {
    // Pode reagendar qualquer agendamento que não esteja cancelado
    // Mesmo que seja passado, permite reagendar para uma nova data futura
    return appointment.status !== 'cancelled';
  };

  // Funções para modal de visualização
  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedAppointment(null);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso!",
      });

      fetchAppointments();
      closeViewModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Função para aceitar agendamento e enviar mensagem WhatsApp
  const handleAcceptAppointment = async (appointment: Appointment) => {
    if (!barbershop?.id) {
      return;
    }

    // Verificar se já está processando este agendamento
    if (acceptingAppointments.has(appointment.id)) {
      return;
    }

    // Adicionar ao set de processamento
    setAcceptingAppointments(prev => new Set(prev).add(appointment.id));

    try {
      // Atualizar status para confirmado
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointment.id);

      if (error) {
        throw error;
      }

      // Enviar mensagem de confirmação via WhatsApp
      const mensagemEnviada = await enviarLembreteWhatsApp({
        barbershopId: barbershop.id,
        customerName: appointment.customer_name,
        customerPhone: appointment.customer_phone,
        scheduledAt: appointment.scheduled_at,
        serviceName: appointment.service?.name || 'Serviço',
        tipo: 'confirmacao',
      });

      toast({
        title: "Agendamento Confirmado!",
        description: mensagemEnviada 
          ? "Mensagem de confirmação enviada via WhatsApp." 
          : "Agendamento confirmado. WhatsApp não conectado.",
      });

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o agendamento.",
        variant: "destructive",
      });
    } finally {
      // Remover do set de processamento
      setAcceptingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointment.id);
        return newSet;
      });
    }
  };

  const updateAppointmentNotes = async (appointmentId: string, notes: string) => {
    setNotesUpdateLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ notes })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Observações atualizadas com sucesso!",
      });

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as observações.",
        variant: "destructive",
      });
    } finally {
      setNotesUpdateLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId?: string) => {
    if (!appointmentId) {
      toast({
        title: "Erro",
        description: "ID do agendamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        console.error("Erro ao excluir agendamento:", error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      fetchAppointments();
      closeViewModal();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  // Funções para reagendamento
  const openRescheduleDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(format(parseISO(appointment.scheduled_at), "yyyy-MM-dd"));
    setSelectedTime("");
    setRescheduleDialogOpen(true);
  };

  const closeRescheduleDialog = () => {
    setRescheduleDialogOpen(false);
    setSelectedAppointment(null);
    setAvailableSlots([]);
    setSelectedTime("");
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    
    if (!date || !selectedAppointment?.service) return;

    try {
      // Usar a mesma função que a página pública usa (com lógica dinâmica)
      const { getAvailableTimeSlots } = await import('@/lib/supabase-queries');
      
      const timeSlots = await getAvailableTimeSlots(
        barbershop?.id || '',
        selectedAppointment.service_id,
        date
      );

      // Filtrar apenas os horários disponíveis
      const availableSlots = timeSlots
        .filter(slot => slot.available)
        .map(slot => slot.time);

      setAvailableSlots(availableSlots);

      if (availableSlots.length === 0) {
        toast({
          title: "Nenhum horário disponível",
          description: "Não há horários disponíveis nesta data. Tente outra data.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !selectedDate || !selectedTime || !barbershop?.id) return;

    setRescheduleLoading(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
      
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: scheduledAt.toISOString() })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      // Enviar mensagem de reagendamento via WhatsApp
      try {
        const mensagemEnviada = await enviarLembreteWhatsApp({
          barbershopId: barbershop.id,
          customerName: selectedAppointment.customer_name,
          customerPhone: selectedAppointment.customer_phone,
          scheduledAt: scheduledAt.toISOString(),
          serviceName: selectedAppointment.service?.name || 'Serviço',
          tipo: 'reagendamento',
        });

        toast({
          title: "Agendamento Reagendado! 🔄",
          description: mensagemEnviada 
            ? "Agendamento reagendado e mensagem enviada via WhatsApp."
            : "Agendamento reagendado com sucesso!",
        });
      } catch (whatsappError) {
        toast({
          title: "Sucesso",
          description: "Agendamento reagendado com sucesso!",
        });
      }

      fetchAppointments();
      closeRescheduleDialog();
      closeViewModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reagendar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setRescheduleLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesDate = !dateFilter || 
      new Date(appointment.scheduled_at).toISOString().split('T')[0] === dateFilter;
    
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesDate && matchesStatus;
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Meus Agendamentos" subtitle="Gerencie os agendamentos da sua barbearia">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Meus Agendamentos"
      subtitle="Gerencie os agendamentos da sua barbearia"
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seletor de Cliente */}
              <div>
                <Label htmlFor="customer_select">Cliente</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    if (value === "new") {
                      setFormData({ ...formData, customer_name: "", customer_phone: "" });
                    } else {
                      const customer = customers.find(c => c.id === value);
                      if (customer) {
                        setFormData({ 
                          ...formData, 
                          customer_name: customer.name, 
                          customer_phone: customer.phone 
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente ou digite novo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Novo Cliente</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de Nome e Telefone (editáveis) */}
              <div>
                <Label htmlFor="customer_name">Nome do Cliente</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Telefone (WhatsApp)</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Data</Label>
                  <Input
                    id="scheduled_date"
                    type="text"
                    placeholder="dd/MM/yyyy"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: dd/MM/yyyy</p>
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    lang="pt-BR"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service_id">Serviço</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAppointment ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Toggle de Visualização */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "calendar")} className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visualização em Lista */}
        <TabsContent value="list" className="mt-0 space-y-4">
          {/* Filtros Compactos */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Filtros</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date-filter" className="text-xs text-muted-foreground">Data</Label>
                  <div className="relative mt-1">
                    <Input
                      id="date-filter"
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={dateFilter ? format(parseISO(dateFilter), 'dd/MM/yyyy') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        let formatted = value;
                        
                        if (value.length >= 2) {
                          formatted = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        if (value.length >= 4) {
                          formatted = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
                        }
                        
                        // Validar e converter para formato ISO se completo
                        if (value.length === 8) {
                          const day = value.slice(0, 2);
                          const month = value.slice(2, 4);
                          const year = value.slice(4, 8);
                          const isoDate = `${year}-${month}-${day}`;
                          
                          // Validar se é uma data válida
                          const testDate = new Date(isoDate);
                          if (!isNaN(testDate.getTime())) {
                            setDateFilter(isoDate);
                          }
                        } else if (value.length === 0) {
                          setDateFilter('');
                        }
                      }}
                      maxLength={10}
                      className="h-11 pr-10"
                      style={{ fontSize: '16px' }}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter" className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredAppointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {dateFilter || statusFilter !== "all" 
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Comece criando seu primeiro agendamento."
            }
          </p>
          {!dateFilter && statusFilter === "all" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Agendamento
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <Card className="group relative overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* MOBILE: Layout Vertical Otimizado */}
                    <div className="p-3 md:hidden">
                      {/* Header Row - Ultra Compacto */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Avatar Circle - Menor */}
                          <div className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold shrink-0",
                            appointment.status === 'confirmed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                            appointment.status === 'cancelled' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            appointment.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>
                            {appointment.customer_name.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Name & Phone - Compacto */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate leading-tight">{appointment.customer_name}</h3>
                            <a 
                              href={`tel:${appointment.customer_phone}`} 
                              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              {appointment.customer_phone}
                            </a>
                          </div>
                        </div>

                        {/* Status Badge - Menor */}
                        <Badge 
                          variant={getStatusInfo(appointment.status).variant}
                          className="text-[9px] px-1.5 py-0.5 font-medium shrink-0"
                        >
                          {getStatusInfo(appointment.status).label}
                        </Badge>
                      </div>

                      {/* Info Row - Inline Compacto */}
                      <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(appointment.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(appointment.scheduled_at)}</span>
                        </div>
                      </div>

                      {/* Service Info - Compacto */}
                      {appointment.service && (
                        <div className="flex items-center justify-between text-[11px] bg-muted/30 rounded px-2 py-1.5 mb-2">
                          <span className="font-medium text-foreground truncate">{appointment.service.name}</span>
                          <span className="font-semibold text-primary whitespace-nowrap ml-2">R$ {appointment.service.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* DESKTOP: Layout Horizontal Ultra-Compacto */}
                    <div className="hidden md:flex items-center gap-3 px-4 py-2.5">
                      {/* Avatar */}
                      <div className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold shrink-0",
                        appointment.status === 'confirmed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        appointment.status === 'cancelled' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        appointment.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}>
                        {appointment.customer_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Nome */}
                      <div className="min-w-[140px]">
                        <h3 className="font-semibold text-sm truncate">{appointment.customer_name}</h3>
                      </div>

                      {/* Telefone */}
                      <a 
                        href={`tel:${appointment.customer_phone}`} 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 min-w-[110px]"
                      >
                        <Phone className="h-3 w-3" />
                        {appointment.customer_phone}
                      </a>

                      {/* Data */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[90px]">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(appointment.scheduled_at)}</span>
                      </div>

                      {/* Horário */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground min-w-[50px]">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(appointment.scheduled_at)}</span>
                      </div>

                      {/* Serviço */}
                      {appointment.service && (
                        <div className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1 min-w-[140px]">
                          <span className="font-medium truncate">{appointment.service.name}</span>
                          <span className="font-semibold text-primary whitespace-nowrap">R$ {appointment.service.price.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <Badge 
                        variant={getStatusInfo(appointment.status).variant}
                        className="text-[10px] px-2 py-0.5 font-medium shrink-0"
                      >
                        {getStatusInfo(appointment.status).label}
                      </Badge>

                      <div className="flex-1" />

                      {/* DESKTOP: Actions - Inline e Compactos */}
                      <div className="flex items-center gap-1">
                        {/* Botões principais para agendamentos pendentes */}
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptAppointment(appointment)}
                              disabled={acceptingAppointments.has(appointment.id)}
                              className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs"
                            >
                              {acceptingAppointments.has(appointment.id) ? (
                                <>
                                  <div className="h-3 w-3 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Confirmando
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aceitar
                                </>
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRescheduleDialog(appointment)}
                              className="h-6 px-2 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reagendar
                            </Button>
                          </>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(appointment)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(appointment)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {appointment.status === 'confirmed' && canReschedule(appointment) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRescheduleDialog(appointment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reagendar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {canCancel(appointment) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancelar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar o agendamento de "{appointment.customer_name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                      </div>
                    </div>

                    {/* MOBILE: Actions Row - Compacto */}
                    <div className="px-3 pb-3 md:hidden">
                      <div className="flex items-center gap-1 pt-2 border-t">
                        {/* Botões principais para agendamentos pendentes */}
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptAppointment(appointment)}
                              disabled={acceptingAppointments.has(appointment.id)}
                              className="bg-green-600 hover:bg-green-700 h-6 px-2 text-[11px] font-medium"
                            >
                              {acceptingAppointments.has(appointment.id) ? (
                                <>
                                  <div className="h-2.5 w-2.5 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span className="hidden sm:inline">Confirmando</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Aceitar</span>
                                </>
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRescheduleDialog(appointment)}
                              className="h-6 px-2 text-[11px] font-medium"
                            >
                              <RefreshCw className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Reagendar</span>
                            </Button>
                          </>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(appointment)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(appointment)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Reagendar para agendamentos confirmados */}
                        {appointment.status === 'confirmed' && canReschedule(appointment) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRescheduleDialog(appointment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reagendar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
        </TabsContent>

        {/* Visualização em Calendário */}
        <TabsContent value="calendar" className="mt-0">
          <div className="h-[calc(100vh-250px)] min-h-[600px]">
            <WeeklyCalendar
              appointments={filteredAppointments}
              onAppointmentClick={(appointment) => openViewModal(appointment)}
              onTimeSlotClick={(date, time) => {
                // Preencher formulário com data e hora selecionadas no formato correto
                const dateString = format(date, 'dd/MM/yyyy');
                setFormData({
                  ...formData,
                  scheduled_date: dateString,
                  scheduled_time: time,
                });
                setIsDialogOpen(true);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização Otimizado */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Info Cards */}
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <label className="text-xs text-muted-foreground">Cliente</label>
                  <p className="font-semibold">{selectedAppointment.customer_name}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <a href={`tel:${selectedAppointment.customer_phone}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhone(selectedAppointment.customer_phone)}
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <label className="text-xs text-muted-foreground">Data</label>
                    <p className="font-semibold text-sm">{formatDate(selectedAppointment.scheduled_at)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <label className="text-xs text-muted-foreground">Horário</label>
                    <p className="font-semibold text-sm">{formatTime(selectedAppointment.scheduled_at)}</p>
                  </div>
                </div>

                {selectedAppointment.service && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <label className="text-xs text-muted-foreground">Serviço</label>
                    <p className="font-semibold">{selectedAppointment.service.name}</p>
                    <p className="text-sm text-primary font-semibold">R$ {selectedAppointment.service.price.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(value) => updateAppointmentStatus(selectedAppointment.id, value)}
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
                  value={selectedAppointment.notes || ''}
                  onChange={(e) => updateAppointmentNotes(selectedAppointment.id, e.target.value)}
                  placeholder="Adicione observações..."
                  className="mt-1 text-sm"
                  rows={3}
                  disabled={notesUpdateLoading}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setViewModalOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAppointment(selectedAppointment?.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamento Otimizado */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Reagendar
            </DialogTitle>
            <DialogDescription className="text-sm">
              Escolha uma nova data e horário
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-2">
              {/* Agendamento Atual Compacto */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Agendamento Atual
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate font-medium">{selectedAppointment.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-semibold">{formatTime(selectedAppointment.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(selectedAppointment.scheduled_at)}</span>
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  Nova Data
                </h3>
                <DatePicker
                  selectedDate={selectedDate ? parseISO(selectedDate) : null}
                  onSelectDate={(date) => {
                    const formattedDate = format(date, 'yyyy-MM-dd');
                    setSelectedDate(formattedDate);
                    handleDateChange(formattedDate);
                  }}
                  minDate={new Date()}
                />
              </div>

              {/* Horários */}
              {selectedDate && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    Novo Horário
                  </h3>
                  
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          type="button"
                          className={cn(
                            "py-2 px-1 rounded-md text-xs font-medium transition-all border-2",
                            selectedTime === slot
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                              : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs font-medium">Nenhum horário disponível</p>
                      <p className="text-xs text-muted-foreground">Tente outra data</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo */}
              {selectedDate && selectedTime && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Novo Agendamento
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-700 dark:text-green-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={closeRescheduleDialog}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReschedule}
              disabled={!selectedTime || rescheduleLoading}
              className="w-full sm:w-auto"
            >
              {rescheduleLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reagendando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Reagendamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Appointments;
