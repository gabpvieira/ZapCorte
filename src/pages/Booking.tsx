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
import "@/styles/booking-premium.css";

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
        title: "Agendamento Realizado! 📅",
        description: `Seu horário foi reservado para ${selectedTime} do dia ${selectedDate.toLocaleDateString('pt-BR')}. Em breve você receberá a confirmação do barbeiro pelo WhatsApp.`,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Premium com Glassmorphism */}
      <motion.div 
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto max-w-6xl w-[90%] sm:w-full px-0 sm:px-4 py-3 sm:py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/barbershop/${slug}`)}
            className="text-foreground hover:bg-muted/50 transition-all hover:scale-105 text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </motion.div>

      <motion.div 
        className="container mx-auto max-w-6xl w-[90%] sm:w-full px-0 sm:px-4 py-6 sm:py-12"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          variants={itemVariants}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Reserve seu Horário
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Escolha o melhor momento para cuidar do seu visual
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Service Info - Card Premium */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl shadow-primary/5 overflow-hidden bg-card/50 backdrop-blur-sm lg:sticky lg:top-24">
              <div className="relative">
                <div
                  className="h-48 sm:h-56 md:h-64 bg-cover bg-center relative overflow-hidden"
                  style={{ backgroundImage: `url(${service.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{service.name}</h3>
                    <p className="text-xs sm:text-sm text-white/90 line-clamp-2">{service.description}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Investimento</p>
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Duração</p>
                    <span className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {service.duration} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Form - Design Premium */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6 sm:pb-8 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl">Complete seu Agendamento</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Preencha os dados abaixo para confirmar
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* Date Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base font-semibold">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      Escolha a Data
                    </Label>
                    <div className="rounded-xl overflow-hidden border border-border/50 bg-background/50">
                      <WeeklyDatePicker
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        minDate={new Date()}
                      />
                    </div>
                  </motion.div>

                  {/* Time Slots */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label className="mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base font-semibold">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      Selecione o Horário
                    </Label>
                    {timeSlots.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 px-4 rounded-xl bg-muted/30 border border-dashed border-border">
                        <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Nenhum horário disponível para esta data.
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Tente selecionar outra data
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
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
                              className={`w-full h-10 sm:h-12 text-xs sm:text-sm font-semibold transition-all ${
                                selectedTime === slot.time 
                                  ? "shadow-lg shadow-primary/30 scale-105" 
                                  : "hover:scale-105 hover:shadow-md"
                              } ${
                                !slot.available 
                                  ? "opacity-30 cursor-not-allowed hover:scale-100" 
                                  : ""
                              }`}
                            >
                              {formatSlotLabel(slot.time)}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Customer Info */}
                  <motion.div
                    className="space-y-4 sm:space-y-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="h-11 sm:h-12 text-sm sm:text-base border-border/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                        WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="h-11 sm:h-12 text-sm sm:text-base border-border/50 focus:border-primary transition-all"
                      />
                      <p className="text-xs text-muted-foreground">
                        Você receberá confirmação e lembretes por WhatsApp
                      </p>
                    </div>
                  </motion.div>

                  {/* Submit Button Premium */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:scale-[1.02]" 
                      disabled={submitting || !selectedTime || !customerName || !customerPhone}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Confirmando...
                        </span>
                      ) : (
                        "Confirmar Agendamento"
                      )}
                    </Button>
                    {selectedTime && customerName && customerPhone && (
                      <motion.p 
                        className="text-center text-xs text-muted-foreground mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        ✓ Tudo pronto! Clique para confirmar
                      </motion.p>
                    )}
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div 
          className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto"
          variants={itemVariants}
        >
          {[
            { icon: "⚡", title: "Confirmação Instantânea", desc: "Receba confirmação imediata" },
            { icon: "🔔", title: "Lembretes Automáticos", desc: "Nunca perca seu horário" },
            { icon: "🔒", title: "Dados Seguros", desc: "Suas informações protegidas" }
          ].map((badge, i) => (
            <motion.div
              key={i}
              className="text-center p-4 sm:p-6 rounded-xl bg-card/30 border border-border/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl sm:text-3xl mb-2">{badge.icon}</div>
              <h4 className="font-semibold text-sm sm:text-base mb-1">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Booking;
