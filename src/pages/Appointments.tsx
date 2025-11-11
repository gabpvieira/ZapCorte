import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Clock, Phone, User, Filter, Eye, RefreshCw, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, parse, isPast, isToday, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { enviarLembreteWhatsApp } from "@/lib/notifications";
import { DatePicker } from "@/components/DatePicker";
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

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    customer_name: "",
    customer_phone: "",
    scheduled_date: "",
    scheduled_time: "",
    service_id: "",
  });
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
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
    }
  }, [barbershop?.id]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("barbershop_id", barbershop?.id);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
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
      console.error("Erro ao buscar agendamentos:", error);
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
        status: "pending" as const,
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

        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
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
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      fetchAppointments();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
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
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
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
    return appointment.status !== 'cancelled' && !isPastAppointment(appointment.scheduled_at);
  };

  const canReschedule = (appointment: Appointment) => {
    return appointment.status !== 'cancelled' && !isPastAppointment(appointment.scheduled_at);
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
      console.error("Erro ao atualizar status:", error);
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
      console.error('[Aceitar] Barbearia não encontrada');
      return;
    }

    // Verificar se já está processando este agendamento
    if (acceptingAppointments.has(appointment.id)) {
      return;
    }

    console.log('[Aceitar] Iniciando confirmação:', {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone,
      barbershopId: barbershop.id,
      serviceName: appointment.service?.name
    });

    // Adicionar ao set de processamento
    setAcceptingAppointments(prev => new Set(prev).add(appointment.id));

    try {
      // Atualizar status para confirmado
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointment.id);

      if (error) {
        console.error('[Aceitar] Erro ao atualizar status:', error);
        throw error;
      }

      console.log('[Aceitar] Status atualizado com sucesso, enviando WhatsApp...');

      // Enviar mensagem de confirmação via WhatsApp
      const mensagemEnviada = await enviarLembreteWhatsApp({
        barbershopId: barbershop.id,
        customerName: appointment.customer_name,
        customerPhone: appointment.customer_phone,
        scheduledAt: appointment.scheduled_at,
        serviceName: appointment.service?.name || 'Serviço',
        tipo: 'confirmacao',
      });

      console.log('[Aceitar] Resultado do envio WhatsApp:', mensagemEnviada);

      toast({
        title: "Agendamento Confirmado!",
        description: mensagemEnviada 
          ? "Mensagem de confirmação enviada via WhatsApp." 
          : "Agendamento confirmado. WhatsApp não conectado.",
      });

      fetchAppointments();
    } catch (error) {
      console.error("[Aceitar] Erro ao aceitar agendamento:", error);
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
      console.error("Erro ao atualizar observações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as observações.",
        variant: "destructive",
      });
    } finally {
      setNotesUpdateLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      fetchAppointments();
      closeViewModal();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
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
      console.log('[Reagendar] Buscando horários disponíveis:', {
        date,
        serviceId: selectedAppointment.service_id,
        serviceDuration: selectedAppointment.service.duration,
        barbershopId: barbershop?.id
      });

      // Usar a mesma função que a página pública usa (com lógica dinâmica)
      const { getAvailableTimeSlots } = await import('@/lib/supabase-queries');
      
      const timeSlots = await getAvailableTimeSlots(
        barbershop?.id || '',
        selectedAppointment.service_id,
        date
      );

      console.log('[Reagendar] Horários recebidos:', timeSlots);

      // Filtrar apenas os horários disponíveis
      const availableSlots = timeSlots
        .filter(slot => slot.available)
        .map(slot => slot.time);

      console.log('[Reagendar] Horários disponíveis:', availableSlots);

      setAvailableSlots(availableSlots);

      if (availableSlots.length === 0) {
        toast({
          title: "Nenhum horário disponível",
          description: "Não há horários disponíveis nesta data. Tente outra data.",
        });
      }
    } catch (error) {
      console.error("[Reagendar] Erro ao buscar horários disponíveis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !selectedDate || !selectedTime) return;

    setRescheduleLoading(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
      
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: scheduledAt.toISOString() })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento reagendado com sucesso!",
      });

      fetchAppointments();
      closeRescheduleDialog();
      closeViewModal();
    } catch (error) {
      console.error("Erro ao reagendar:", error);
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
      {/* Filtros */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-base md:text-lg">
            <Filter className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="filters-container grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="filter-item">
              <Label htmlFor="date-filter" className="text-sm">Filtrar por Data</Label>
              <Input
                id="date-filter"
                type="date"
                lang="pt-BR"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {dateFilter ? format(new Date(`${dateFilter}T00:00:00`), 'dd/MM/yyyy') : ''}
              </p>
            </div>
            <div className="filter-item">
              <Label htmlFor="status-filter" className="text-sm">Filtrar por Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
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
                <Card className="appointment-card hover:shadow-lg transition-shadow mobile-full-width">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="appointment-info space-y-3 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold text-sm md:text-base">{appointment.customer_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-gray-600">{appointment.customer_phone}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="text-xs md:text-sm">{formatDate(appointment.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="text-xs md:text-sm">{formatTime(appointment.scheduled_at)}</span>
                          </div>
                        </div>

                        {appointment.service && (
                          <div className="text-xs md:text-sm text-gray-600">
                            <strong>Serviço:</strong> {appointment.service.name} - R$ {appointment.service.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="appointment-actions flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start space-x-2 md:space-x-0 md:space-y-3">
                        <Badge variant={getStatusInfo(appointment.status).variant} className="text-xs">
                          {getStatusInfo(appointment.status).label}
                        </Badge>

                        <div className="flex space-x-1 md:space-x-2">
                          {/* Botão de Aceitar - apenas para status pendente */}
                          {appointment.status === 'pending' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAcceptAppointment(appointment)}
                                    disabled={acceptingAppointments.has(appointment.id)}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {acceptingAppointments.has(appointment.id) ? (
                                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{acceptingAppointments.has(appointment.id) ? 'Confirmando...' : 'Aceitar agendamento'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openViewModal(appointment)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar detalhes</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(appointment)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar agendamento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {canReschedule(appointment) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRescheduleDialog(appointment)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reagendar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {canCancel(appointment) && (
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <AlertDialogTrigger asChild>
                                    <TooltipTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                  </AlertDialogTrigger>
                                  <TooltipContent>
                                    <p>Cancelar agendamento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
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

                          <AlertDialog>
                            <TooltipProvider>
                              <Tooltip>
                                <AlertDialogTrigger asChild>
                                  <TooltipTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                </AlertDialogTrigger>
                                <TooltipContent>
                                  <p>Excluir agendamento</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o agendamento de "{appointment.customer_name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(appointment.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      {/* Modal de Visualização */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes do agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <p className="text-sm text-gray-600">{selectedAppointment.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm text-gray-600">{formatPhone(selectedAppointment.customer_phone)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedAppointment.scheduled_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Horário</label>
                  <p className="text-sm text-gray-600">{formatTime(selectedAppointment.scheduled_at)}</p>
                </div>
              </div>

              {selectedAppointment.service && (
                <div>
                  <label className="text-sm font-medium">Serviço</label>
                  <p className="text-sm text-gray-600">{selectedAppointment.service.name} - R$ {selectedAppointment.service.price.toFixed(2)}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Select
                    value={selectedAppointment.status}
                    onValueChange={(value) => updateAppointmentStatus(selectedAppointment.id, value)}
                    disabled={statusUpdateLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={selectedAppointment.notes || ''}
                  onChange={(e) => updateAppointmentNotes(selectedAppointment.id, e.target.value)}
                  placeholder="Adicione observações sobre o agendamento..."
                  className="mt-1"
                  rows={3}
                  disabled={notesUpdateLoading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Fechar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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

      {/* Modal de Reagendamento - Design Premium */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-primary" />
              Reagendar Agendamento
            </DialogTitle>
            <DialogDescription className="text-base">
              Escolha uma nova data e horário para o atendimento
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6 py-4">
              {/* Informações do Agendamento Atual */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Agendamento Atual
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{selectedAppointment.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedAppointment.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">{formatTime(selectedAppointment.scheduled_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">Selecione a Nova Data</h3>
                </div>
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

              {/* Horários Disponíveis */}
              {selectedDate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h3 className="text-lg font-semibold">Escolha o Horário</h3>
                  </div>
                  
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          type="button"
                          className={cn(
                            "py-3 px-2 rounded-lg text-sm font-medium transition-all",
                            "border-2 hover:scale-105 hover:shadow-md",
                            selectedTime === slot
                              ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                              : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-base font-medium text-foreground mb-1">
                        Nenhum horário disponível
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tente selecionar outra data
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo da Seleção */}
              {selectedDate && selectedTime && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                        Novo Agendamento
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-green-700 dark:text-green-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{selectedTime}</span>
                        </div>
                      </div>
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