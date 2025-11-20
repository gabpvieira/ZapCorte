import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Instagram, MessageCircle, Calendar, Search, ExternalLink, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getBarbershopBySlug, getBarbershopServices } from "@/lib/supabase-queries";
import { isBarbershopOpen, formatOpeningHours } from "@/lib/barbershop-utils";
import type { Barbershop, Service } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { BarbershopSEO } from "@/components/BarbershopSEO";
import "@/styles/booking-premium.css";

const Barbershop = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [appointments, setAppointments] = useState<Array<{ id: string; customer_name: string; customer_phone: string; scheduled_at: string; status: string; service?: { name: string; duration: number } }>>([]);

  useEffect(() => {
    const loadBarbershopData = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const barbershopData = await getBarbershopBySlug(slug);
        if (!barbershopData) {
          setError('Barbearia não encontrada');
          return;
        }
        
        setBarbershop(barbershopData);
        
        // Verificar se está aberto
        const openStatus = isBarbershopOpen(barbershopData.opening_hours);
        setIsOpen(openStatus);
        
        const servicesData = await getBarbershopServices(barbershopData.id);
        setServices(servicesData);
      } catch (err) {
        setError('Erro ao carregar dados da barbearia');
      } finally {
        setLoading(false);
      }
    };

    loadBarbershopData();
  }, [slug]);

  const handleBooking = (serviceSlug: string) => {
    setSelectedService(serviceSlug);
    navigate(`/booking/${slug}/${serviceSlug}`);
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

  if (error || !barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ops!</h1>
          <p className="text-muted-foreground mb-4">{error || 'Barbearia não encontrada'}</p>
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
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

  const bannerVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      {/* SEO Dinâmico */}
      <BarbershopSEO barbershop={barbershop} />
      
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 overflow-x-hidden"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
      {/* Hero Banner Premium - Full Width */}
      <motion.div 
        className="relative w-full h-[300px] sm:h-[350px] md:h-[350px] lg:h-[350px] xl:h-[350px] mb-16 sm:mb-20"
        variants={bannerVariants}
      >
        {/* Banner Image - Full Width */}
        <div className="absolute inset-0">
          <img 
            src={barbershop.banner_url || '/placeholder-banner.jpg'} 
            alt={`Banner ${barbershop.name}`}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </div>
        
        {/* Logo Premium - Posicionada para sobrepor */}
        <div className="absolute inset-x-0 -bottom-16 sm:-bottom-20 flex items-center justify-center z-30">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <img 
                src={barbershop.logo_url || '/placeholder-logo.jpg'} 
                alt={`Logo ${barbershop.name}`}
                className="relative rounded-full w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] border-4 border-background shadow-2xl object-cover ring-4 ring-primary/20" 
              />
            </div>
          </motion.div>
        </div>

        {/* Curva inferior premium */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-[40px] sm:h-[60px] md:h-[80px] pointer-events-none"
        >
          <path
            d="M0,64 C240,120 480,120 720,80 C960,40 1200,40 1440,80 L1440,120 L0,120 Z"
            style={{ fill: 'hsl(var(--background))' }}
          />
        </svg>
      </motion.div>

      {/* Header Info Premium */}
      <motion.section 
        className="text-center w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8 max-w-5xl"
        variants={itemVariants}
      >
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {barbershop.name}
        </motion.h1>
        
        {barbershop.subtitle && (
          <motion.p 
            className="text-base sm:text-lg text-muted-foreground mb-5 sm:mb-6 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {barbershop.subtitle}
          </motion.p>
        )}

        {/* Status Badge Premium */}
        <motion.div 
          className="mb-5 sm:mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span 
            className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-lg ${
              isOpen 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/30' 
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/30'
            }`}
          >
            <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isOpen ? 'bg-white' : 'bg-white/80'} animate-pulse`} />
            {isOpen ? 'ABERTO AGORA' : 'FECHADO'}
          </span>
        </motion.div>

        {/* Social Links Premium */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-5 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {barbershop.instagram_url && (
            <motion.a 
              href={barbershop.instagram_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          )}
          {barbershop.whatsapp_number && (
            <motion.a 
              href={`https://wa.me/${barbershop.whatsapp_number}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          )}
          {barbershop.maps_url && (
            <motion.a 
              href={barbershop.maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Maps"
            >
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          )}
        </motion.div>

        {/* Horário de funcionamento Premium */}
        <motion.div
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {formatOpeningHours(barbershop.opening_hours)}
          </p>
        </motion.div>
      </motion.section>

      {/* Container para serviços */}
      <motion.div 
        className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 max-w-7xl"
        variants={itemVariants}
      >

        {/* Services Section Premium */}
        <section className="pb-16 sm:pb-20">
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Nossos Serviços
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Escolha o serviço perfeito para você e agende seu horário
            </p>
          </motion.div>

          {services.length === 0 ? (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <Clock className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-lg">Nenhum serviço disponível no momento.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden border-0 shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col bg-card/50 backdrop-blur-sm">
                    {/* Service Image com Overlay */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      
                      {/* Price Badge Floating */}
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-4 lg:px-2 py-1 sm:py-2 lg:py-1 rounded-md sm:rounded-xl lg:rounded-md bg-primary text-primary-foreground font-bold text-xs sm:text-lg lg:text-xs shadow-lg backdrop-blur-sm">
                        R$ {service.price.toFixed(2)}
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2 lg:gap-1 px-2 sm:px-3 lg:px-2 py-0.5 sm:py-1.5 lg:py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm lg:text-xs">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" />
                        {service.duration} min
                      </div>
                    </div>

                    {/* Service Content */}
                    <CardContent className="p-3 sm:p-5 lg:p-3 flex-1 flex flex-col">
                      <h3 className="mb-1.5 sm:mb-3 lg:mb-1.5 text-base sm:text-2xl lg:text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 lg:line-clamp-2">
                        {service.name}
                      </h3>
                      <p className="mb-3 sm:mb-6 lg:mb-3 text-xs sm:text-sm lg:text-xs text-muted-foreground flex-1 line-clamp-2">
                        {service.description}
                      </p>

                      {/* CTA Button Premium */}
                      <Button
                        className="w-full h-9 sm:h-12 lg:h-8 text-xs sm:text-base lg:text-xs font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02] group"
                        size="lg"
                        onClick={() => handleBooking(service.slug)}
                      >
                        <span className="group-hover:scale-110 transition-transform inline-block">
                          Agendar Agora
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Meus Agendamentos Premium */}
        <section className="pb-20 sm:pb-24">
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Meus Agendamentos
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Consulte seus horários agendados
            </p>
          </motion.div>

          <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden max-w-4xl mx-auto w-full">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50 px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl break-words">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="break-words">Buscar por Telefone</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                    Número do WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: 11987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 sm:h-12 border-border/50 focus:border-primary transition-all"
                    style={{ fontSize: '16px', WebkitTextSizeAdjust: '100%' }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o número usado no agendamento
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={async () => {
                      if (!barbershop?.id || !phone.trim()) return;
                      try {
                        setSearchLoading(true);
                        const { data, error } = await supabase
                          .from("appointments")
                          .select(`*, services(name, duration)`)
                          .eq("barbershop_id", barbershop.id)
                          .eq("customer_phone", phone.trim())
                          .order("scheduled_at", { ascending: true });
                        if (error) throw error;
                        const mapped = (data || []).map((apt: any) => ({
                          id: apt.id,
                          customer_name: apt.customer_name,
                          customer_phone: apt.customer_phone,
                          scheduled_at: apt.scheduled_at,
                          status: apt.status,
                          service: apt.services ? { name: apt.services.name, duration: apt.services.duration } : undefined,
                        }));
                        setAppointments(mapped);
                        setSearchPerformed(true);
                      } catch (err) {
                        // Erro silenciado
                      } finally {
                        setSearchLoading(false);
                      }
                    }}
                    disabled={searchLoading || !phone.trim()}
                    className="h-12 px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                  >
                    {searchLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Buscando...
                      </span>
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>
              </div>

              {/* Resultados Premium */}
              <div className="space-y-4">
                {searchPerformed && appointments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 px-4 rounded-2xl bg-muted/20 border border-dashed border-border"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                      Não encontramos agendamentos para este telefone.
                    </p>
                  </motion.div>
                ) : (
                  appointments.map((apt, index) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-card to-card/50 overflow-hidden group w-full">
                        <CardContent className="p-4 sm:p-5 w-full overflow-hidden">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
                            {/* Info Principal */}
                            <div className="flex-1 space-y-3 w-full min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                  <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-base sm:text-lg mb-1 truncate">{apt.customer_name}</h4>
                                  <p className="text-sm text-muted-foreground break-all">{apt.customer_phone}</p>
                                </div>
                              </div>

                              {/* Data e Hora */}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {new Date(apt.scheduled_at).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {new Date(apt.scheduled_at).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Serviço */}
                              {apt.service && (
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="break-words">{apt.service.name}</span>
                                  <span className="flex-shrink-0">•</span>
                                  <span className="flex-shrink-0">{apt.service.duration} minutos</span>
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              <span className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                                ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : ''}
                                ${apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : ''}
                                ${apt.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : ''}
                                ${apt.status === 'completed' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : ''}
                              `}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  apt.status === 'confirmed' ? 'bg-green-600' : 
                                  apt.status === 'pending' ? 'bg-yellow-600' : 
                                  apt.status === 'cancelled' ? 'bg-red-600' : 
                                  'bg-blue-600'
                                }`} />
                                {apt.status === 'confirmed' ? 'Confirmado' : 
                                 apt.status === 'pending' ? 'Pendente' : 
                                 apt.status === 'cancelled' ? 'Cancelado' : 
                                 'Concluído'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>

      {/* Footer Sutil */}
      <motion.footer 
        className="relative border-t border-border/50 py-8 sm:py-10 mt-20 w-full"
        variants={itemVariants}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 max-w-7xl">
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
    </>
  );
};

export default Barbershop;
