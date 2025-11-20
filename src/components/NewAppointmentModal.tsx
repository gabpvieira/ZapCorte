import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, User, Clock, CalendarCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAvailableTimeSlotsV2, createAppointment } from "@/lib/supabase-queries";
import WeeklyDatePicker from "@/components/WeeklyDatePicker";
import { FitInAppointmentForm } from "@/components/FitInAppointmentForm";
import { enviarLembreteWhatsApp } from "@/lib/notifications";
import { parse } from "date-fns";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Barber {
  id: string;
  name: string;
  photo_url?: string;
  specialties?: string[];
}

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: string;
  services: Service[];
  onSuccess: () => void;
  isPro: boolean;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  barbershopId,
  services,
  onSuccess,
  isPro
}: NewAppointmentModalProps) {
  const { toast } = useToast();
  
  // Estados para novo agendamento
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  // Estados para barbeiros (PRO feature)
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  // Buscar clientes quando o modal abre
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!barbershopId || !open) return;
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('barbershop_id', barbershopId)
          .order('name', { ascending: true });

        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    };

    fetchCustomers();
  }, [barbershopId, open]);

  // Buscar barbeiros quando o modal abre (PRO feature)
  useEffect(() => {
    const fetchBarbers = async () => {
      if (!barbershopId || !open || !isPro) return;
      
      setLoadingBarbers(true);
      try {
        const { data, error } = await supabase
          .from('barbers')
          .select('id, name, photo_url, specialties, is_active')
          .eq('barbershop_id', barbershopId)
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
  }, [barbershopId, open, isPro]);

  // Carregar horários disponíveis quando serviço, data ou barbeiro mudam
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!barbershopId || !selectedService || !selectedDate) return;
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // ✅ USAR getAvailableTimeSlotsV2 que decide automaticamente qual lógica usar
        // Se Plano PRO + barberId: usa horários do barbeiro
        // Caso contrário: usa horários da barbearia
        const slots = await getAvailableTimeSlotsV2(
          barbershopId,
          selectedService,
          dateString,
          selectedBarberId || undefined // Passar barberId se selecionado
        );
        
        setTimeSlots(slots);
        setSelectedTime(null);
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        setTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [barbershopId, selectedService, selectedDate, selectedBarberId, isPro]);

  // Atualização em tempo real dos horários
  useEffect(() => {
    if (!barbershopId || !selectedService || !selectedDate) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    const refreshSlots = async () => {
      try {
        // ✅ USAR getAvailableTimeSlotsV2 para atualização em tempo real
        const slots = await getAvailableTimeSlotsV2(
          barbershopId,
          selectedService,
          dateString,
          selectedBarberId || undefined
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error('Erro ao atualizar horários:', error);
      }
    };

    const channel = supabase.channel('realtime-appointments-modal')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${barbershopId}`,
        },
        () => {
          refreshSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershopId, selectedService, selectedDate]);

  const closeModal = () => {
    onOpenChange(false);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setTimeSlots([]);
    setIsFitIn(false);
    setIsFitInMode(false);
    setSelectedBarberId(null);
    setBarbers([]);
  };

  const handleFitInSubmit = async (data: {
    customer_name: string;
    customer_phone: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    service_id: string;
    barber_id?: string;
  }) => {
    try {
      setSubmitting(true);
      
      // Converter dd/MM/yyyy -> yyyy-MM-dd
      const parsedDate = parse(data.scheduled_date, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        toast({
          title: "Data inválida",
          description: "Use o formato dd/MM/yyyy.",
          variant: "destructive",
        });
        return;
      }
      const isoDate = format(parsedDate, 'yyyy-MM-dd');
      const scheduledAt = `${isoDate}T${data.start_time}:00-03:00`;
      
      // Determinar o barbeiro a ser atribuído
      let finalBarberId = data.barber_id || null;
      
      // Se não foi selecionado barbeiro e é plano PRO, tentar atribuição automática
      if (!finalBarberId && isPro) {
        const serviceDuration = services.find(s => s.id === data.service_id)?.duration || 30;
        const { findBestAvailableBarber } = await import('@/lib/barber-scheduler');
        
        const bestBarberId = await findBestAvailableBarber(
          barbershopId,
          data.service_id,
          scheduledAt,
          serviceDuration
        );
        
        if (bestBarberId) {
          finalBarberId = bestBarberId;
        }
      }
      
      await createAppointment({
        barbershop_id: barbershopId,
        service_id: data.service_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: true,
        ...(finalBarberId && { barber_id: finalBarberId })
      });

      // Enviar mensagem de confirmação via WhatsApp
      try {
        const serviceName = services.find(s => s.id === data.service_id)?.name || 'Serviço';
        
        await enviarLembreteWhatsApp({
          barbershopId,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          scheduledAt,
          serviceName,
          tipo: 'confirmacao',
        });

        toast({
          title: "Encaixe Criado! ⚡",
          description: "Encaixe criado e confirmação enviada via WhatsApp.",
        });
      } catch (whatsappError) {
        toast({
          title: "Sucesso",
          description: "Encaixe criado com sucesso!",
        });
      }

      closeModal();
      onSuccess();
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
    
    if (!selectedTime || !customerName || !customerPhone || !barbershopId || !selectedService || !selectedDate) {
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
      
      // Determinar o barbeiro a ser atribuído
      let finalBarberId = selectedBarberId;
      
      // Se "Atribuição Automática" foi selecionada e é plano PRO
      if (!selectedBarberId && isPro) {
        const serviceDuration = services.find(s => s.id === selectedService)?.duration || 30;
        const { findBestAvailableBarber } = await import('@/lib/barber-scheduler');
        
        const bestBarberId = await findBestAvailableBarber(
          barbershopId,
          selectedService,
          scheduledAt,
          serviceDuration
        );
        
        if (bestBarberId) {
          finalBarberId = bestBarberId;
        }
      }
      
      await createAppointment({
        barbershop_id: barbershopId,
        service_id: selectedService,
        customer_name: customerName,
        customer_phone: customerPhone,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        is_fit_in: isFitIn,
        ...(finalBarberId && { barber_id: finalBarberId })
      });

      // Enviar mensagem de confirmação via WhatsApp
      try {
        const serviceName = services.find(s => s.id === selectedService)?.name || 'Serviço';
        
        await enviarLembreteWhatsApp({
          barbershopId,
          customerName,
          customerPhone,
          scheduledAt,
          serviceName,
          tipo: 'confirmacao',
        });

        toast({
          title: "Agendamento Criado! 📅",
          description: "Horário reservado e confirmação enviada via WhatsApp.",
        });
      } catch (whatsappError) {
        toast({
          title: "Agendamento Criado! 📅",
          description: `Horário reservado para ${selectedTime} do dia ${selectedDate.toLocaleDateString('pt-BR')}.`,
        });
      }

      closeModal();
      onSuccess();
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  htmlFor="fit_in_toggle"
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
              id="fit_in_toggle"
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
            barbers={barbers}
            isPro={isPro}
            onSubmit={handleFitInSubmit}
            onCancel={closeModal}
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
                        <div className="flex items-center gap-1">
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

            {/* Seleção de Barbeiro (PRO Feature) */}
            {isPro && selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-purple-500 rounded-full" />
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Escolha o Barbeiro
                    <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                      PRO
                    </Badge>
                  </h3>
                </div>
                
                {loadingBarbers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : barbers.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl bg-muted/30 border border-dashed border-border">
                    <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum barbeiro cadastrado ainda.
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={selectedBarberId || "none"} 
                    onValueChange={(value) => setSelectedBarberId(value === "none" ? null : value)}
                  >
                    <SelectTrigger className="h-auto min-h-[60px]">
                      <SelectValue placeholder="Selecione um barbeiro (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-3 py-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border-2 border-purple-500/30">
                            <User className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Atribuição Automática</span>
                            <span className="text-xs text-muted-foreground">Sistema escolhe o melhor barbeiro</span>
                          </div>
                        </div>
                      </SelectItem>
                      {barbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          <div className="flex items-center gap-3 py-2">
                            {barber.photo_url ? (
                              <img
                                src={barber.photo_url}
                                alt={barber.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{barber.name}</span>
                              {barber.specialties && barber.specialties.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {barber.specialties.slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </motion.div>
            )}

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
              <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !selectedTime}>
                {submitting ? "Criando..." : "Criar Agendamento"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
