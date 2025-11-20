import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, ArrowLeft, Zap, Bell, Shield, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { getBarbershopBySlug, getBarbershopServices, createAppointment, getAvailableTimeSlotsV2, getServiceBySlug } from "@/lib/supabase-queries";
import { getAvailableBarbersForService } from "@/lib/barbers-queries";
import { supabase } from "@/lib/supabase";
import { notificarNovoAgendamento } from '@/lib/notifications';
import "@/styles/booking-premium.css";
import type { Barbershop, Service, Barber } from "@/lib/supabase";
import WeeklyDatePicker from "@/components/WeeklyDatePicker";
import { BarberSelector } from "@/components/BarberSelector";
import { format } from "date-fns";

const Booking = () => {
  const { slug, serviceSlug } = useParams<{ slug: string; serviceSlug: string }>();
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
  
  // Estados para múltiplos barbeiros (Plano PRO)
  const [availableBarbers, setAvailableBarbers] = useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [hasPlanPro, setHasPlanPro] = useState(false);

  // Exibir apenas o horário inicial conforme requisito
  const formatSlotLabel = (startTime: string) => startTime;

  useEffect(() => {
    const loadData = async () => {
      if (!slug || !serviceSlug) return;
      
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
        
        // Verificar se a barbearia tem Plano PRO
        const isPro = barbershopData.plan_type === 'pro';
        setHasPlanPro(isPro);
        
        // Buscar serviço por slug (único globalmente)
        let foundService: Service | null = null;
        
        // Verificar se é um UUID (compatibilidade com URLs antigas)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceSlug);
        
        if (isUUID) {
          // Buscar por ID (compatibilidade)
          const services = await getBarbershopServices(barbershopData.id);
          foundService = services.find(s => s.id === serviceSlug) || null;
        } else {
          // Buscar por slug (novo formato)
          foundService = await getServiceBySlug(serviceSlug);
          
          // Verificar se o serviço pertence a esta barbearia
          if (foundService && foundService.barbershop_id !== barbershopData.id) {
            foundService = null;
          }
        }
        
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
  }, [slug, serviceSlug, navigate, toast]);

  // Carregar barbeiros disponíveis (apenas para Plano PRO)
  useEffect(() => {
    const loadBarbers = async () => {
      if (!barbershop || !service || !selectedDate || !hasPlanPro) return;
      
      try {
        setLoadingBarbers(true);
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const barbers = await getAvailableBarbersForService(
          barbershop.id,
          service.id,
          dateString
        );
        setAvailableBarbers(barbers);
        
        // Se não houver barbeiro selecionado e houver barbeiros disponíveis, não selecionar automaticamente
        // Deixar o usuário escolher
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        setAvailableBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    loadBarbers();
  }, [barbershop, service, selectedDate, hasPlanPro]);

  // Carregar horários disponíveis
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!barbershop || !service || !selectedDate) return;
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // ✅ USAR getAvailableTimeSlotsV2 que decide automaticamente qual lógica usar
        // Se Plano PRO + barberId: usa horários do barbeiro
        // Caso contrário: usa horários da barbearia
        const slots = await getAvailableTimeSlotsV2(
          barbershop.id,
          service.id,
          dateString,
          selectedBarberId || undefined // Passar barberId se selecionado
        );
        
        setTimeSlots(slots);
        setSelectedTime(null); // Reset selected time when date or barber changes
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        setTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [barbershop, service, selectedDate, hasPlanPro, selectedBarberId]);

  // Atualização em tempo real: quando a tabela de appointments muda, recalcular horários
  useEffect(() => {
    if (!barbershop || !service || !selectedDate) return;

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    const refreshSlots = async () => {
      try {
        // ✅ USAR getAvailableTimeSlotsV2 para atualização em tempo real
        const slots = await getAvailableTimeSlotsV2(
          barbershop.id,
          service.id,
          dateString,
          selectedBarberId || undefined
        );
        
        setTimeSlots(slots);
      } catch (error) {
        console.error('Erro ao atualizar horários:', error);
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
  }, [barbershop, service, selectedDate, hasPlanPro, selectedBarberId]);

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
      
      const newAppointment = await createAppointment({
        barbershop_id: barbershop.id,
        service_id: service.id,
        barber_id: selectedBarberId || undefined, // Incluir barbeiro se selecionado
        customer_name: customerName,
        customer_phone: customerPhone,
        scheduled_at: scheduledAt,
        status: 'pending'
      });

      // Criar ou atualizar cliente automaticamente
      try {
        const cleanPhone = customerPhone.replace(/\D/g, '');
        
        // Verificar se cliente já existe
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('barbershop_id', barbershop.id)
          .eq('phone', cleanPhone)
          .single();

        if (!existingCustomer) {
          // Criar novo cliente
          await supabase
            .from('customers')
            .insert({
              barbershop_id: barbershop.id,
              name: customerName,
              phone: cleanPhone,
              notes: `Cliente criado automaticamente via agendamento online em ${new Date().toLocaleDateString('pt-BR')}`
            });
        }
      } catch (customerError) {
        // Não bloqueia o agendamento se falhar
      }

      // Enviar notificação e webhook n8n
      try {
        console.log('📤 Enviando notificação de novo agendamento...');
        const notificacaoEnviada = await notificarNovoAgendamento({
          barbershopId: barbershop.id,
          customerName,
          scheduledAt,
          customerPhone,
          serviceName: service.name,
          appointmentId: newAppointment?.id, // Passar o ID do agendamento criado
        });
        
        if (notificacaoEnviada) {
          console.log('✅ Notificação e webhook enviados com sucesso');
        } else {
          console.warn('⚠️ Notificação/webhook não foram enviados');
        }
      } catch (notifyErr) {
        console.error('❌ Erro ao enviar notificação:', notifyErr);
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

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[350px_1fr] xl:grid-cols-[380px_1fr] max-w-6xl mx-auto">
          {/* Service Info - Card Premium */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl shadow-primary/5 overflow-hidden bg-card/50 backdrop-blur-sm lg:sticky lg:top-24">
              <div className="relative">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="text-xl sm:text-2xl lg:text-lg font-bold text-white mb-1">{service.name}</h3>
                    <p className="text-xs sm:text-sm lg:text-xs text-white/90 line-clamp-2">{service.description}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6 lg:p-4">
                <div className="flex items-center justify-between p-3 sm:p-4 lg:p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Investimento</p>
                    <span className="text-2xl sm:text-3xl lg:text-xl font-bold text-primary">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Duração</p>
                    <span className="flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-base sm:text-lg lg:text-base font-semibold">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4 lg:w-4 text-primary" />
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
              <CardHeader className="pb-6 sm:pb-8 lg:pb-6 px-4 sm:px-6 lg:px-5">
                <CardTitle className="text-xl sm:text-2xl lg:text-xl">Complete seu Agendamento</CardTitle>
                <p className="text-xs sm:text-sm lg:text-xs text-muted-foreground mt-2">
                  Preencha os dados abaixo para confirmar
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 lg:px-5">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-5">
                  {/* Date Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label className="mb-3 sm:mb-4 lg:mb-3 flex items-center gap-2 text-sm sm:text-base lg:text-sm font-semibold">
                      <div className="p-1.5 sm:p-2 lg:p-1.5 rounded-lg bg-primary/10">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-primary" />
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

                  {/* Barber Selector - Apenas para Plano PRO */}
                  {hasPlanPro && selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <BarberSelector
                        barbers={availableBarbers}
                        selectedBarberId={selectedBarberId}
                        onSelectBarber={setSelectedBarberId}
                        loading={loadingBarbers}
                      />
                    </motion.div>
                  )}

                  {/* Time Slots */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label className="mb-3 sm:mb-4 lg:mb-3 flex items-center gap-2 text-sm sm:text-base lg:text-sm font-semibold">
                      <div className="p-1.5 sm:p-2 lg:p-1.5 rounded-lg bg-primary/10">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-primary" />
                      </div>
                      Selecione o Horário
                    </Label>
                    
                    {/* Mensagem informativa para hoje */}
                    {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
                      <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          Horários que já passaram não estão disponíveis para agendamento
                        </p>
                      </div>
                    )}
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
                              className={`w-full h-10 sm:h-12 text-xs sm:text-sm font-semibold transition-all relative ${
                                selectedTime === slot.time 
                                  ? "shadow-lg shadow-primary/30 scale-105" 
                                  : "hover:scale-105 hover:shadow-md"
                              } ${
                                !slot.available 
                                  ? "opacity-30 cursor-not-allowed hover:scale-100 line-through" 
                                  : ""
                              }`}
                              title={!slot.available ? "Horário indisponível" : ""}
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
                        className="h-11 sm:h-12 border-border/50 focus:border-primary transition-all"
                        style={{ fontSize: '16px', WebkitTextSizeAdjust: '100%' }}
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
                        className="h-11 sm:h-12 border-border/50 focus:border-primary transition-all"
                        style={{ fontSize: '16px', WebkitTextSizeAdjust: '100%' }}
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
                        className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Tudo pronto! Clique para confirmar
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
            { 
              Icon: Zap, 
              title: "Confirmação Instantânea", 
              desc: "Receba confirmação imediata",
              gradient: "from-yellow-500 to-orange-500"
            },
            { 
              Icon: Bell, 
              title: "Lembretes Automáticos", 
              desc: "Nunca perca seu horário",
              gradient: "from-blue-500 to-cyan-500"
            },
            { 
              Icon: Shield, 
              title: "Dados Seguros", 
              desc: "Suas informações protegidas",
              gradient: "from-green-500 to-emerald-500"
            }
          ].map((badge, i) => (
            <motion.div
              key={i}
              className="text-center p-4 sm:p-6 rounded-xl bg-card/30 border border-border/50 hover:border-primary/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${badge.gradient} mb-3 sm:mb-4`}>
                <badge.Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h4 className="font-semibold text-sm sm:text-base mb-1">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Sutil */}
        <motion.footer 
          className="relative border-t border-border/50 py-8 sm:py-10 mt-16 sm:mt-20"
          variants={itemVariants}
        >
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 max-w-4xl">
            {/* CTA Sutil */}
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Quer um sistema como este para sua barbearia?
              </p>
              <a
                href="https://www.zapcorte.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
              >
                <span>Conhecer o ZapCorte</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            {/* Branding */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">
                Powered by ZapCorte • Sistema de Agendamento Premium
              </p>
            </div>
            
            {/* Tagline */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Feito com</span>
              <span className="text-red-500">❤️</span>
              <span>para profissionais</span>
            </div>
          </div>
        </motion.footer>
      </motion.div>
    </div>
  );
};

export default Booking;
