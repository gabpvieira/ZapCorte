import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, User, Phone, X, RefreshCw, AlertCircle } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
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
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

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
      console.error('Erro ao buscar agendamentos:', error);
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
      console.error('Erro ao cancelar agendamento:', error);
      setError('Erro ao cancelar agendamento. Tente novamente.');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pendente', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳',
          description: 'Aguardando confirmação'
        };
      case 'confirmed':
        return { 
          label: 'Confirmado', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          description: 'Agendamento confirmado'
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          description: 'Agendamento cancelado'
        };
      default:
        return { 
          label: 'Desconhecido', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓',
          description: 'Status desconhecido'
        };
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
    // try {
    //   const response = await fetch(`/api/available-slots?barbershopId=${barbershopId}&serviceId=${serviceId}&date=${date}`);
    //   const data = await response.json();
    //   return data.slots || [];
    // } catch (error) {
    //   console.error('Erro ao buscar horários disponíveis:', error);
    //   return [];
    // }
    console.warn('fetchAvailableSlots está desabilitado temporariamente');
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
        selectedAppointment.barbershop_name, // Aqui seria o ID da barbearia
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
      console.error('Erro ao reagendar:', error);
      setError('Erro ao reagendar. Tente novamente.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Cabeçalho informativo */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Como funciona</h3>
              <p className="text-sm text-blue-700 mt-1">
                Digite seu telefone para visualizar seus agendamentos. Você pode cancelar ou reagendar 
                atendimentos futuros diretamente por esta página.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Agendamentos</h1>
          <p className="text-gray-600">
            Consulte e gerencie seus agendamentos informando seu telefone
          </p>
        </div>

        {/* Formulário de busca */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Buscar Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="phone">Telefone</Label>
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
                  className={error ? 'border-red-500' : ''}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={searchAppointments}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da busca */}
        {searchPerformed && (
          <>
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum agendamento encontrado
                    </h3>
                    <p className="text-gray-500">
                      Não encontramos agendamentos para o telefone {formatPhone(phone)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Seus Agendamentos ({appointments.length})
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPhone('');
                      setAppointments([]);
                      setSearchPerformed(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Nova Busca
                  </Button>
                </div>

                <AnimatePresence>
                  {appointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Informações da barbearia */}
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {appointment.barbershop_name}
                              </h3>
                              {appointment.barbershop_address && (
                                <p className="text-sm text-gray-600">
                                  {appointment.barbershop_address}
                                </p>
                              )}
                            </div>

                            {/* Data e horário */}
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {formatDate(appointment.scheduled_at)}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {formatTime(appointment.scheduled_at)}
                                  {appointment.service && (
                                    <> - {getEndTime(appointment.scheduled_at, appointment.service.duration)}</>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Serviço */}
                            {appointment.service && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-600">
                                  <strong>Serviço:</strong> {appointment.service.name}
                                  {appointment.service.price > 0 && (
                                    <> - R$ {appointment.service.price.toFixed(2)}</>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Cliente */}
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{appointment.customer_name}</span>
                              </div>
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{formatPhone(appointment.customer_phone)}</span>
                              </div>
                            </div>

                            {/* Alerta de horário passado */}
                            {isPastAppointment(appointment.scheduled_at) && appointment.status !== 'cancelled' && (
                              <div className="flex items-center text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Este agendamento já ocorreu
                              </div>
                            )}

                            {/* Informações sobre ações disponíveis */}
                            <div className="flex items-center justify-between mt-2 p-2 bg-gray-50 rounded border">
                              <span className="text-xs text-gray-600">
                                {getStatusInfo(appointment.status).description}
                              </span>
                              <div className="flex gap-1">
                                {canReschedule(appointment) && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Reagendamento disponível
                                  </span>
                                )}
                                {canCancel(appointment) && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    Cancelamento disponível
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status e ações */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                            <Badge className={`${getStatusInfo(appointment.status).color} px-3 py-1 border`}>
                              <span className="mr-1">{getStatusInfo(appointment.status).icon}</span>
                              {getStatusInfo(appointment.status).label}
                            </Badge>

                            <div className="flex gap-2">
                              {canReschedule(appointment) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => openRescheduleDialog(appointment)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Reagendar
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Escolher nova data e horário</p>
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
                                        <Button variant="destructive" size="sm">
                                          <X className="mr-2 h-4 w-4" />
                                          Cancelar
                                        </Button>
                                      </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja cancelar o agendamento de{' '}
                                      <strong>{formatDate(appointment.scheduled_at)}</strong> às{' '}
                                      <strong>{formatTime(appointment.scheduled_at)}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelAppointment(appointment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Cancelar Agendamento
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cancelar este agendamento</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Modal de Reagendamento */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reagendar Atendimento</DialogTitle>
              <DialogDescription>
                Escolha uma nova data e horário para o seu agendamento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Nova Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Horários Disponíveis</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {rescheduleLoading ? (
                      <div className="col-span-3 text-center py-4">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-gray-500" />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </Button>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        Nenhum horário disponível para esta data
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTime && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Novo horário:</strong> {selectedDate} às {selectedTime}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || rescheduleLoading}
              >
                Confirmar Reagendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyAppointments;