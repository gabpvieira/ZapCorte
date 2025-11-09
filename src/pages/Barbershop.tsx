import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Instagram, MessageCircle, Calendar, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getBarbershopBySlug, getBarbershopServices } from "@/lib/supabase-queries";
import { isBarbershopOpen, formatOpeningHours } from "@/lib/barbershop-utils";
import type { Barbershop, Service } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

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
        console.error('Erro ao carregar dados da barbearia:', err);
        setError('Erro ao carregar dados da barbearia');
      } finally {
        setLoading(false);
      }
    };

    loadBarbershopData();
  }, [slug]);

  const handleBooking = (serviceId: string) => {
    setSelectedService(serviceId);
    navigate(`/booking/${slug}/${serviceId}`);
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
    <motion.div 
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Banner */}
      <motion.div 
        className="relative w-full h-[200px] overflow-hidden"
        variants={bannerVariants}
      >
        <div className="w-full h-full bg-black">
          <img 
            src={barbershop.banner_url || '/placeholder-banner.jpg'} 
            alt={`Banner ${barbershop.name}`}
            className="w-full h-full object-cover" 
          />
        </div>
        {/* Curva inferior (meia-lua invertida) integrada ao banner */}
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-[80px] block"
        >
          <path
            d="M0,160 C480,320 960,0 1440,160 L1440,320 L0,320 Z"
            style={{ fill: 'hsl(var(--background))' }}
          />
        </svg>
      </motion.div>

      {/* Logo sobreposta e centralizada */}
      <motion.div 
        className="relative -mt-[55px] flex justify-center z-20 mb-4"
        variants={itemVariants}
      >
        <img 
          src={barbershop.logo_url || '/placeholder-logo.jpg'} 
          alt={`Logo ${barbershop.name}`}
          className="rounded-full w-[110px] h-[110px] border-4 border-white shadow-lg object-cover" 
        />
      </motion.div>

      {/* Curvatura integrada no banner; removido bloco decorativo separado */}

      {/* Cabeçalho e conteúdo */}
      <motion.section 
        className="text-center px-4 -mt-4"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-bold text-white">{barbershop.name}</h1>
        {barbershop.subtitle && (
          <p className="text-sm text-gray-400 mt-1">{barbershop.subtitle}</p>
        )}

        {/* Ícones sociais */}
        <div className="flex justify-center gap-4 mt-4">
          {barbershop.instagram_url && (
            <a 
              href={barbershop.instagram_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-110 transition-transform"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {barbershop.whatsapp_number && (
            <a 
              href={`https://wa.me/${barbershop.whatsapp_number}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-green-500 text-white hover:scale-110 transition-transform"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          {barbershop.maps_url && (
            <a 
              href={barbershop.maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-blue-500 text-white hover:scale-110 transition-transform"
              aria-label="Maps"
            >
              <MapPin className="h-5 w-5" />
            </a>
          )}
        </div>

        {/* Status dinâmico */}
        <div className="mt-4">
          <span 
            id="statusBadge" 
            className={`inline-block px-4 py-1 rounded-full text-white font-medium text-sm ${
              isOpen ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {isOpen ? 'ABERTO' : 'FECHADO'}
          </span>
        </div>

        {/* Horário de funcionamento */}
        <p className="mt-4 text-xs text-gray-500 max-w-md mx-auto">
          {formatOpeningHours(barbershop.opening_hours)}
        </p>
      </motion.section>

      {/* Container para serviços */}
      <motion.div 
        className="container mx-auto px-4 mt-12"
        variants={itemVariants}
      >

        {/* Services */}
        <section className="pb-20">
          <h2 className="mb-6 text-2xl font-bold">Nossos Serviços</h2>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden border-2 transition-all hover:shadow-lg hover:shadow-primary/10">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${service.image_url})` }}
                  />
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-xl font-bold">{service.name}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{service.description}</p>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        R$ {service.price.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleBooking(service.id)}
                    >
                      Agendar Agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Meus Agendamentos (público, filtrado pela barbearia) */}
        <section className="pb-24">
          <h2 className="mb-6 text-2xl font-bold">Meus Agendamentos</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Buscar por Telefone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: 11987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={async () => {
                      if (!barbershop?.id || !phone.trim()) return;
                      try {
                        setSearchLoading(true);
                        const { data, error } = await supabase
                          .from("appointments")
                          .select(`*, services(name, duration)`) // incluir serviço básico
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
                        console.error("Erro ao buscar agendamentos:", err);
                      } finally {
                        setSearchLoading(false);
                      }
                    }}
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>

              {/* Resultados */}
              <div className="mt-8 space-y-4">
                {searchPerformed && appointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      Nenhum agendamento encontrado para este telefone nesta barbearia.
                    </CardContent>
                  </Card>
                ) : (
                  appointments.map((apt) => (
                    <Card key={apt.id} className="border-2">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-white">{apt.customer_name}</div>
                          <div className="text-sm text-gray-400">{apt.customer_phone}</div>
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{new Date(apt.scheduled_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {apt.service && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{apt.service.name} ({apt.service.duration} min)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs px-2 py-1 rounded-full border border-gray-600 text-gray-300">
                            {apt.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="border-t border-border py-8 mt-12"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by ZapCorte - Sistema de Agendamento</p>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default Barbershop;
