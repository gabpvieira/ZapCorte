import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { getBarbershopBySlug, getBarbershopServices, createAppointment, getAvailableTimeSlots } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabase";
import { notificarNovoAgendamento } from '@/lib/notifications';

async function registrarPushBarbeiro(barbershopId: string) {
  if (!window.OneSignalDeferred) return;

  window.OneSignalDeferred.push(async function (OneSignal: any) {
    const permission = await OneSignal.Notifications.permissionNative();
    if (permission !== 'granted') {
      await OneSignal.Notifications.requestPermission();
    }

    const playerId = await OneSignal.User.getId();

    // Enviar para o Supabase
    const { error } = await supabase
      .from('barbershops')
      .update({ player_id: playerId })
      .eq('id', barbershopId);

    if (error) {
      console.error('Erro ao salvar o playerId:', error);
    } else {
      console.log('Player ID salvo com sucesso:', playerId);
    }
  });
}
import type { Barbershop, Service } from "@/lib/supabase";
import WeeklyDatePicker from "@/components/WeeklyDatePicker";
import { format } from "date-fns";

const Booking = () => {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Exibir apenas o horário inicial conforme requisito
  const formatSlotLabel = (startTime: string) => startTime;

  useEffect(() => {
    const loadData = async () => {
      if (!slug || !serviceId) return;
      
      try {
        setLoading(true);
        
        const barbershopData = await getBarbershopBySlug(slug);
        if (!barbershopData) {
          toast({
            title: "Erro",
            description: "Barbearia não encontrada",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        setBarbershop(barbershopData);
        
        const services = await getBarbershopServices(barbershopData.id);
        const foundService = services.find(s => s.id === serviceId);
        
        if (!foundService) {
          toast({
            title: "Erro",
            description: "Serviço não encontrado",
            variant: "destructive",
          });
          navigate(`/barbershop/${slug}`);
          return;
        }
        
        setService(foundService);
        
        // Set default date to today
        setSelectedDate(new Date());
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, serviceId, navigate, toast]);

  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!barbershop || !service || !selectedDate) return;
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const slots = await getAvailableTimeSlots(barbershop.id, service.id, dateString);
        setTimeSlots(slots);
        setSelectedTime(null); // Reset selected time when date changes
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        setTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [barbershop, service, selectedDate]);

  // Atualização em tempo real: quando a tabela de appointments muda, recalcular horários
  useEffect(() => {
    if (!barbershop || !service || !selectedDate) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    const refreshSlots = async () => {
      try {
        const slots = await getAvailableTimeSlots(barbershop.id, service.id, dateString);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Erro ao atualizar horários (realtime):', error);
      }
    };

    const channel = supabase.channel('realtime-appointments')
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
  }, [barbershop, service, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTime || !customerName || !customerPhone || !barbershop || !service || !selectedDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Create datetime string com timezone local (Brasília = UTC-3)
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const scheduledAt = `${dateString}T${selectedTime}:00-03:00`;
      
      await createAppointment({
        barbershop_id: barbershop.id,
        service_id: service.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        scheduled_at: scheduledAt,
        status: 'pending'
      });

      // Registrar push do barbeiro e enviar notificação
      try {
        // Registrar player_id do barbeiro
        await registrarPushBarbeiro(barbershop.id);

        // Buscar player_id atualizado
        const { data: barberData } = await (await import("@/lib/supabase")).supabase
          .from('barbershops')
          .select('player_id')
          .eq('id', barbershop.id)
          .single();

        if (barberData?.player_id) {
          await notificarNovoAgendamento({
            playerId: barberData.player_id,
            customerName,
            scheduledAt,
          });
        }
      } catch (notifyErr) {
        console.warn('Não foi possível enviar notificação OneSignal:', notifyErr);
      }

      toast({
        title: "Agendamento Confirmado! ✅",
        description: `Seu horário foi reservado para ${selectedTime} do dia ${selectedDate.toLocaleDateString('pt-BR')}. Você receberá um lembrete no WhatsApp.`,
      });

      // Redirect back after 2 seconds
      setTimeout(() => {
        navigate(`/barbershop/${slug}`);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!service || !barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ops!</h1>
          <p className="text-muted-foreground mb-4">Serviço não encontrado</p>
          <Button onClick={() => navigate(`/barbershop/${slug}`)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <motion.div 
        className="container mx-auto max-w-4xl px-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            onClick={() => navigate(`/barbershop/${slug}`)}
            className="mb-6 text-foreground hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Service Info */}
          <motion.div variants={itemVariants}>
            <Card className="border-2">
            <CardHeader>
              <CardTitle>Resumo do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="h-48 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${service.image_url})` }}
              />
              <div>
                <h3 className="mb-2 text-xl font-bold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-2xl font-bold text-primary">
                  R$ {service.price.toFixed(2)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {service.duration} min
                </span>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Booking Form */}
          <motion.div variants={itemVariants}>
            <Card className="border-2">
            <CardHeader>
              <CardTitle>Escolha seu Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selector */}
                <div>
                  <Label className="mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Escolha a Data
                  </Label>
                  <WeeklyDatePicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    minDate={new Date()}
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário
                  </Label>
                  {timeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Nenhum horário disponível para esta data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                           className={`w-full ${!slot.available ? "opacity-40 cursor-not-allowed" : ""}`}
                         >
                           {formatSlotLabel(slot.time)}
                         </Button>
                       ))}
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Confirmando..." : "Confirmar Agendamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Booking;
