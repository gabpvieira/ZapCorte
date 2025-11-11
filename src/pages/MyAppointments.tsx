import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, User, Phone, X, RefreshCw, AlertCircle, Plus, Filter, CheckCircle2, XCircle, Timer, Eye, Edit3, Trash2, MapPin, DollarSign, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO, isToday, isTomorrow, isThisWeek, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  service: Service | null;
  barbershop_name: string;
  barbershop_address: string;
}

const MyAppointments = () => {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Premium filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm');
  };

  const getEndTime = (dateString: string, duration: number) => {
    const startTime = parseISO(dateString);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    return format(endTime, 'HH:mm');
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
        return { 
          label: 'Pendente', 
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          darkColor: 'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          icon: Timer,
          iconColor: 'text-amber-600',
          description: 'Aguardando confirmação'
        };
      case 'confirmed':
        return { 
          label: 'Confirmado', 
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          darkColor: 'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          description: 'Agendamento confirmado'
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-50 text-red-700 border-red-200',
          darkColor: 'dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
          icon: XCircle,
          iconColor: 'text-red-600',
          description: 'Agendamento cancelado'
        };
      default:
        return { 
          label: 'Desconhecido', 
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          darkColor: 'dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          description: 'Status desconhecido'
        };
    }
  };

  // Premium filter functions
  const applyFilters = () => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(apt => statusFilter.includes(apt.status));
    }

    // Date filter
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(apt => isToday(parseISO(apt.scheduled_at)));
        break;
      case 'tomorrow':
        filtered = filtered.filter(apt => isTomorrow(parseISO(apt.scheduled_at)));
        break;
      case 'week':
        filtered = filtered.filter(apt => isThisWeek(parseISO(apt.scheduled_at)));
        break;
      case 'past':
        filtered = filtered.filter(apt => parseISO(apt.scheduled_at) < now);
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => parseISO(apt.scheduled_at) >= now);
        break;
    }

    setFilteredAppointments(filtered);
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDateFilter('all');
    setFilteredAppointments(appointments);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const groups: { [key: string]: Appointment[] } = {};
    
    appointments.forEach(apt => {
      const dateKey = format(parseISO(apt.scheduled_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [appointments, statusFilter, dateFilter]);

  const searchAppointments = async () => {
    if (!phone.trim()) {
      setError('Por favor, informe seu telefone');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Buscar agendamentos pelo telefone
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(id, name, duration, price),
          barbershop:barbershops(id, name, address)
        `)
        .eq('customer_phone', phone.trim())
        .order('scheduled_at', { ascending: true });

      if (appointmentsError) {
        throw appointmentsError;
      }

      const formattedAppointments: Appointment[] = appointmentsData?.map(apt => ({
        id: apt.id,
        customer_name: apt.customer_name,
        customer_phone: apt.customer_phone,
        scheduled_at: apt.scheduled_at,
        status: apt.status,
        service: apt.service ? {
          id: apt.service.id,
          name: apt.service.name,
          duration: apt.service.duration,
          price: apt.service.price
        } : null,
        barbershop_name: apt.barbershop?.name || 'Barbearia',
        barbershop_address: apt.barbershop?.address || ''
      })) || [];

      setAppointments(formattedAppointments);
      setSearchPerformed(true);
    } catch (error) {
      setError('Erro ao buscar agendamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      // Atualizar a lista de agendamentos
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const }
            : apt
        )
      );
    } catch (error) {
      setError('Erro ao cancelar agendamento. Tente novamente.');
    }
  };

  const isPastAppointment = (scheduledAt: string) => {
    return new Date(scheduledAt) < new Date();
  };

  const canCancel = (appointment: Appointment) => {
    return appointment.status !== 'cancelled' && !isPastAppointment(appointment.scheduled_at);
  };

  const canReschedule = (appointment: Appointment) => {
    return appointment.status !== 'cancelled' && !isPastAppointment(appointment.scheduled_at);
  };

  const fetchAvailableSlots = async (barbershopId: string, serviceId: string, date: string) => {
    return Promise.resolve([]);
  };

  const openRescheduleDialog = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setRescheduleDialogOpen(true);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    
    if (selectedAppointment && date) {
      const slots = await fetchAvailableSlots(
        selectedAppointment.barbershop_name,
        selectedAppointment.service?.id || '',
        date
      );
      setAvailableSlots(slots);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !selectedDate || !selectedTime) {
      setError('Por favor, selecione uma data e horário');
      return;
    }

    setRescheduleLoading(true);
    
    try {
      const newDateTime = `${selectedDate}T${selectedTime}:00`;
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          scheduled_at: newDateTime,
          status: 'pending'
        })
        .eq('id', selectedAppointment.id);

      if (error) {
        throw error;
      }

      // Atualizar a lista de agendamentos
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, scheduled_at: newDateTime, status: 'pending' as const }
            : apt
        )
      );

      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
    } catch (error) {
      setError('Erro ao reagendar. Tente novamente.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0C0C] via-[#111111] to-[#0C0C0C] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-[#24C36B]/10 rounded-2xl">
              <Calendar className="h-8 w-8 text-[#24C36B]" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
            Meus Agendamentos
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Gerencie seus agendamentos com facilidade e elegância
          </p>
        </motion.div>

        {/* Premium Info Card */}
        <motion.div 
          className="mb-8 p-6 bg-gradient-to-r from-[#24C36B]/10 to-[#1ea557]/10 border border-[#24C36B]/20 rounded-2xl backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-[#24C36B]/20 rounded-xl">
              <Sparkles className="h-6 w-6 text-[#24C36B]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Como funciona</h3>
              <p className="text-gray-300 leading-relaxed">
                Digite seu telefone para visualizar todos os seus agendamentos. Você pode cancelar, reagendar 
                e acompanhar o status dos seus atendimentos em tempo real.
              </p>
            </div>
          </div>
        </motion.div>     
   {/* Premium Search Form */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-[#18181B]/50 border-[#27272A] backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white">
                <div className="p-2 bg-[#24C36B]/20 rounded-lg mr-3">
                  <Search className="h-5 w-5 text-[#24C36B]" />
                </div>
                Buscar Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone" className="text-gray-300 font-medium">Telefone</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          searchAppointments();
                        }
                      }}
                      className={`pl-10 bg-[#0C0C0C] border-[#27272A] text-white placeholder-gray-500 focus:border-[#24C36B] focus:ring-[#24C36B] ${
                        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                  </div>
                  {error && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2 flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </motion.p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchAppointments}
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Results Section */}
        {searchPerformed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {appointments.length === 0 ? (
              <Card className="bg-[#18181B]/50 border-[#27272A] backdrop-blur-sm">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="p-4 bg-[#24C36B]/10 rounded-full w-20 h-20 mx-auto mb-6">
                      <Calendar className="w-12 h-12 text-[#24C36B] mx-auto mt-2" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Nenhum agendamento encontrado
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Não encontramos agendamentos para o telefone {formatPhone(phone)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Premium Header with Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-white">
                      Seus Agendamentos
                    </h2>
                    <Badge className="bg-[#24C36B]/20 text-[#24C36B] border-[#24C36B]/30 px-3 py-1">
                      {filteredAppointments.length} de {appointments.length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="border-[#27272A] text-gray-300 hover:text-white hover:bg-[#27272A]"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhone('');
                        setAppointments([]);
                        setFilteredAppointments([]);
                        setSearchPerformed(false);
                        clearFilters();
                      }}
                      className="border-[#27272A] text-gray-300 hover:text-white hover:bg-[#27272A]"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Nova Busca
                    </Button>
                  </div>
                </div>

                {/* Premium Filters Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#18181B]/50 border border-[#27272A] rounded-2xl p-6 backdrop-blur-sm"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Filter */}
                        <div>
                          <Label className="text-white font-medium mb-3 block">Filtrar por Status</Label>
                          <div className="flex flex-wrap gap-2">
                            {['pending', 'confirmed', 'cancelled'].map((status) => {
                              const statusInfo = getStatusInfo(status);
                              const isSelected = statusFilter.includes(status);
                              return (
                                <button
                                  key={status}
                                  onClick={() => toggleStatusFilter(status)}
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[#24C36B]/20 border-[#24C36B] text-[#24C36B]'
                                      : 'bg-[#0C0C0C] border-[#27272A] text-gray-400 hover:border-[#24C36B]/50 hover:text-gray-300'
                                  }`}
                                >
                                  <statusInfo.icon className="h-4 w-4" />
                                  <span>{statusInfo.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Date Filter */}
                        <div>
                          <Label className="text-white font-medium mb-3 block">Filtrar por Data</Label>
                          <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="bg-[#0C0C0C] border-[#27272A] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181B] border-[#27272A]">
                              <SelectItem value="all" className="text-white">Todos os períodos</SelectItem>
                              <SelectItem value="today" className="text-white">Hoje</SelectItem>
                              <SelectItem value="tomorrow" className="text-white">Amanhã</SelectItem>
                              <SelectItem value="week" className="text-white">Esta semana</SelectItem>
                              <SelectItem value="upcoming" className="text-white">Próximos</SelectItem>
                              <SelectItem value="past" className="text-white">Passados</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(statusFilter.length > 0 || dateFilter !== 'all') && (
                        <div className="mt-4 pt-4 border-t border-[#27272A]">
                          <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Limpar Filtros
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence> 
               {/* Premium Appointment Cards Grouped by Date */}
                <div className="space-y-8">
                  {groupAppointmentsByDate(filteredAppointments).map(([dateKey, dayAppointments], groupIndex) => (
                    <motion.div
                      key={dateKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
                    >
                      {/* Date Group Header */}
                      <div className="flex items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#24C36B]/20 rounded-lg">
                            <Calendar className="h-5 w-5 text-[#24C36B]" />
                          </div>
                          <h3 className="text-xl font-semibold text-white">
                            {getDateLabel(dayAppointments[0].scheduled_at)}
                          </h3>
                          <Badge className="bg-[#27272A] text-gray-300 border-[#27272A]">
                            {dayAppointments.length} agendamento{dayAppointments.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>

                      {/* Appointments for this date */}
                      <div className="space-y-4">
                        <AnimatePresence>
                          {dayAppointments.map((appointment, index) => {
                            const statusInfo = getStatusInfo(appointment.status);
                            const StatusIcon = statusInfo.icon;
                            
                            return (
                              <motion.div
                                key={appointment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group bg-gradient-to-r from-[#18181B]/80 to-[#1a1a1a]/80 border border-[#27272A] rounded-2xl p-6 backdrop-blur-sm hover:border-[#24C36B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#24C36B]/10"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                  {/* Main Content */}
                                  <div className="flex-1 space-y-4">
                                    {/* Barbershop Info */}
                                    <div className="flex items-start space-x-4">
                                      <div className="p-2 bg-[#24C36B]/10 rounded-xl">
                                        <MapPin className="h-5 w-5 text-[#24C36B]" />
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-bold text-white mb-1">
                                          {appointment.barbershop_name}
                                        </h4>
                                        {appointment.barbershop_address && (
                                          <p className="text-gray-400 text-sm">
                                            {appointment.barbershop_address}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Time and Service Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="flex items-center space-x-3">
                                        <Clock className="h-5 w-5 text-[#24C36B]" />
                                        <div>
                                          <p className="text-white font-semibold">
                                            {formatTime(appointment.scheduled_at)}
                                            {appointment.service && (
                                              <span className="text-gray-400 ml-2">
                                                - {getEndTime(appointment.scheduled_at, appointment.service.duration)}
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-gray-400 text-sm">Horário do atendimento</p>
                                        </div>
                                      </div>

                                      {appointment.service && (
                                        <div className="flex items-center space-x-3">
                                          <DollarSign className="h-5 w-5 text-[#24C36B]" />
                                          <div>
                                            <p className="text-white font-semibold">
                                              {appointment.service.name}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                              {appointment.service.price > 0 
                                                ? `R$ ${appointment.service.price.toFixed(2)}`
                                                : 'Preço a combinar'
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex items-center space-x-6 p-3 bg-[#0C0C0C]/50 rounded-xl">
                                      <div className="flex items-center space-x-3">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-300">{appointment.customer_name}</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-300">{formatPhone(appointment.customer_phone)}</span>
                                      </div>
                                    </div>

                                    {/* Past Appointment Alert */}
                                    {isPastAppointment(appointment.scheduled_at) && appointment.status !== 'cancelled' && (
                                      <div className="flex items-center space-x-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <AlertCircle className="h-5 w-5 text-amber-400" />
                                        <span className="text-amber-300 font-medium">Este agendamento já ocorreu</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Status and Actions */}
                                  <div className="flex flex-col items-end space-y-4">
                                    {/* Status Badge */}
                                    <Badge className={`${statusInfo.color} ${statusInfo.darkColor} px-4 py-2 text-sm font-medium border flex items-center space-x-2`}>
                                      <StatusIcon className="h-4 w-4" />
                                      <span>{statusInfo.label}</span>
                                    </Badge>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                      {canReschedule(appointment) && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                size="sm"
                                                onClick={() => openRescheduleDialog(appointment)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
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
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button 
                                                    variant="destructive" 
                                                    size="sm"
                                                    className="px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-[#18181B] border-[#27272A]">
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white">Cancelar Agendamento</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-300">
                                                      Tem certeza que deseja cancelar o agendamento de{' '}
                                                      <strong className="text-white">{getDateLabel(appointment.scheduled_at)}</strong> às{' '}
                                                      <strong className="text-white">{formatTime(appointment.scheduled_at)}</strong>?
                                                      <br />
                                                      <span className="text-red-400">Esta ação não pode ser desfeita.</span>
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-[#27272A] text-white border-[#27272A] hover:bg-[#3a3a3a]">
                                                      Voltar
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() => cancelAppointment(appointment.id)}
                                                      className="bg-red-600 text-white hover:bg-red-700"
                                                    >
                                                      Cancelar Agendamento
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Cancelar</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )} 
       {/* Premium Reschedule Modal */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-[#18181B] border-[#27272A] text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center">
                <div className="p-2 bg-[#24C36B]/20 rounded-lg mr-3">
                  <RefreshCw className="h-6 w-6 text-[#24C36B]" />
                </div>
                Reagendar Atendimento
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-lg">
                Escolha uma nova data e horário para o seu agendamento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-white font-medium text-lg">Nova Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-[#0C0C0C] border-[#27272A] text-white focus:border-[#24C36B] focus:ring-[#24C36B] text-lg py-3"
                />
              </div>

              {selectedDate && (
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label className="text-white font-medium text-lg">Horários Disponíveis</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {rescheduleLoading ? (
                      <div className="col-span-3 text-center py-8">
                        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#24C36B]" />
                        <p className="text-gray-400 mt-2">Carregando horários...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="lg"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-3 rounded-xl transition-all duration-200 ${
                            selectedTime === slot
                              ? 'bg-[#24C36B] text-black hover:bg-[#1ea557] transform scale-105'
                              : 'bg-[#0C0C0C] border-[#27272A] text-white hover:border-[#24C36B]/50 hover:bg-[#27272A]'
                          }`}
                        >
                          {slot}
                        </Button>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8">
                        <div className="p-4 bg-[#27272A]/50 rounded-xl">
                          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-400">Nenhum horário disponível para esta data</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {selectedTime && (
                <motion.div 
                  className="bg-gradient-to-r from-[#24C36B]/10 to-[#1ea557]/10 border border-[#24C36B]/20 p-4 rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-[#24C36B]" />
                    <div>
                      <p className="text-white font-semibold">Novo horário selecionado</p>
                      <p className="text-[#24C36B]">
                        {format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="space-x-3">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
                className="bg-[#27272A] border-[#27272A] text-white hover:bg-[#3a3a3a] px-6 py-3 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || rescheduleLoading}
                className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {rescheduleLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirmar Reagendamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyAppointments;