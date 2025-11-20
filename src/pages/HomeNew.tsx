import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, Users, ArrowRight, Play, CheckCircle, MessageSquare, 
  Globe, Menu, X, LogIn, UserPlus, Clock, TrendingUp, Zap,
  Smartphone, BarChart3, Shield, Star, ChevronRight, Scissors,
  Phone, UserX, TrendingDown, Frown, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import logotipo from "@/assets/zapcorte-icon.png";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

const HomeNew = () => {
  // SEO
  useSEO(SEO_CONFIGS.home);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const testimonials = [
    {
      name: "Marcos Vinícius",
      role: "Vinícius Barber",
      text: "Tava no vermelho, brother. Depois do ZapCorte? Faturamento dobrou em 6 meses. Contratei mais um barbeiro e já tô de olho num ponto maior. Melhor investimento que fiz!",
      rating: 5,
      highlight: "Faturamento dobrou em 6 meses"
    },
    {
      name: "Rafael Santana",
      role: "Barbearia do Rafa",
      text: "WhatsApp não parava NEM NO DOMINGO. Minha mina já tava pistola kkkkk. Com o ZapCorte, cliente marca sozinho e eu só corto. Voltei a ter paz. Agenda lotada sem estresse!",
      rating: 5,
      highlight: "Agenda lotada sem estresse"
    },
    {
      name: "Bruno Costa",
      role: "BH Barbearia",
      text: "Queria que minha barbearia fosse vista como TOP. Caderno em papel não passa profissionalismo. Depois do sistema, clientes elogiam demais! Cobro mais caro e eles pagam de boa. Vale muito!",
      rating: 5,
      highlight: "Cobro mais caro e eles pagam"
    },
    {
      name: "Thiago Alves",
      role: "TA Barbearia",
      text: "Comecei sozinho num cantinho. Hoje tenho 5 barbeiros e vou abrir a segunda unidade! ZapCorte me deu dados pra crescer certo. Em 3 meses já tinha 40% mais cliente. Sem volta!",
      rating: 5,
      highlight: "40% mais clientes em 3 meses"
    },
    {
      name: "Felipe Rocha",
      role: "Rocha's Barber",
      text: "Antes: 5 faltas por semana = prejuízo. Depois: ZERO faltas! Lembretes automáticos funcionam demais. Economizo 2h por dia e ganho mais. Sistema se paga sozinho, mano!",
      rating: 5,
      highlight: "ZERO faltas com lembretes"
    }
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#0C0C0C] via-[#0C0C0C] to-[#18181B] text-white overflow-x-hidden"
      style={{ 
        backgroundColor: '#0C0C0C',
        minHeight: '100vh'
      }}
    >

      {/* Modern Floating Header */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-black/80 backdrop-blur-2xl border-b border-[#24C36B]/10 shadow-[0_8px_32px_rgba(36,195,107,0.1)]' 
            : 'bg-transparent'
        }`}
        style={isScrolled ? { 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          WebkitBackdropFilter: 'blur(40px)',
          backdropFilter: 'blur(40px)'
        } : undefined}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo com efeito hover */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#24C36B]/20 rounded-xl blur-lg group-hover:bg-[#24C36B]/40 transition-all" />
                <img src={logotipo} alt="ZapCorte" className="h-10 w-10 rounded-xl relative z-10" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight">
                  Zap<span className="text-[#24C36B]">Corte</span>
                </span>
                <span className="text-[10px] text-gray-400 -mt-1">Agendamento Inteligente</span>
              </div>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { id: 'funcionalidades', label: 'Funcionalidades' },
                { id: 'beneficios', label: 'Benefícios' },
                { id: 'planos', label: 'Planos' },
                { id: 'depoimentos', label: 'Depoimentos' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="relative px-4 py-2 text-gray-300 hover:text-white transition-colors group"
                >
                  <span className="relative z-10">{item.label}</span>
                  <motion.div
                    className="absolute inset-0 bg-[#24C36B]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.05 }}
                  />
                </button>
              ))}
            </nav>

            {/* CTA Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#24C36B]/20 transition-all" 
                asChild
              >
                <Link to="/login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#24C36B] to-[#1ea557] hover:from-[#1ea557] hover:to-[#24C36B] text-black font-semibold shadow-lg shadow-[#24C36B]/25 hover:shadow-[#24C36B]/40 transition-all" 
                asChild
              >
                <Link to="/register" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Começar Grátis</span>
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button 
              className="md:hidden p-2.5 rounded-xl hover:bg-[#24C36B]/10 border border-[#24C36B]/20 transition-all relative z-[60]" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#24C36B]" /> : <Menu className="w-6 h-6 text-[#24C36B]" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay - Full Screen */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#0C0C0C] z-50 md:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header do Menu */}
              <div className="flex items-center justify-between p-6 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <img src={logotipo} alt="ZapCorte" className="h-8 w-8 rounded-lg" />
                  <span className="text-xl font-bold">ZapCorte</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#27272A] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  <button 
                    onClick={() => scrollToSection('funcionalidades')} 
                    className="flex items-center w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-[#27272A] rounded-xl transition-all group"
                  >
                    <Globe className="w-5 h-5 mr-3 text-[#24C36B]" />
                    <span className="font-medium">Funcionalidades</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('beneficios')} 
                    className="flex items-center w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-[#27272A] rounded-xl transition-all group"
                  >
                    <Star className="w-5 h-5 mr-3 text-[#24C36B]" />
                    <span className="font-medium">Benefícios</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('planos')} 
                    className="flex items-center w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-[#27272A] rounded-xl transition-all group"
                  >
                    <TrendingUp className="w-5 h-5 mr-3 text-[#24C36B]" />
                    <span className="font-medium">Planos</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('depoimentos')} 
                    className="flex items-center w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-[#27272A] rounded-xl transition-all group"
                  >
                    <Users className="w-5 h-5 mr-3 text-[#24C36B]" />
                    <span className="font-medium">Depoimentos</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </nav>

              {/* Footer com Botões de Ação */}
              <div className="p-6 border-t border-[#27272A] space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black py-6 rounded-xl font-semibold" 
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/login" className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </Link>
                </Button>
                
                <Button 
                  className="w-full bg-[#24C36B] hover:bg-[#1ea557] text-black py-6 rounded-xl font-semibold shadow-lg shadow-[#24C36B]/20" 
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/register" className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Começar Grátis
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#24C36B]/10 via-transparent to-transparent" />
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 left-10 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 overflow-visible">
          <div className="grid lg:grid-cols-2 gap-12 items-center overflow-visible">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-8"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Transforme sua barbearia com{" "}
                <span className="text-[#24C36B] relative">
                  agendamento online
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-[#24C36B]/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </h1>

              <motion.p 
                className="text-2xl sm:text-3xl font-semibold text-[#24C36B] leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Sua Barbearia Organizada, No Seu Ritmo.
              </motion.p>

              <p className="text-xl text-gray-300 leading-relaxed">
                Pare de perder tempo com ligações e mensagens. Deixe seus clientes agendarem online 24/7 enquanto você foca no que faz de melhor: Atende seus clientes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-8 py-6 text-lg rounded-xl group" asChild>
                  <Link to="/register">
                    Começar Grátis Agora
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black px-8 py-6 text-lg rounded-xl" asChild>
                  <a href="#demo">
                    <Play className="w-5 h-5 mr-2" />
                    Ver Demonstração
                  </a>
                </Button>
              </div>

              {/* Trust Indicators - Redesenhado */}
              <div className="flex flex-wrap items-center gap-4 pt-6">
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-[#24C36B]/5 border border-[#24C36B]/20 rounded-full"
                  whileHover={{ scale: 1.05, borderColor: "rgba(36, 195, 107, 0.4)" }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle className="w-4 h-4 text-[#24C36B]" />
                  <span className="text-sm text-gray-200 font-medium">Sem cartão de crédito</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-[#24C36B]/5 border border-[#24C36B]/20 rounded-full"
                  whileHover={{ scale: 1.05, borderColor: "rgba(36, 195, 107, 0.4)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Clock className="w-4 h-4 text-[#24C36B]" />
                  <span className="text-sm text-gray-200 font-medium">Configuração em 5 minutos</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-[#24C36B]/5 border border-[#24C36B]/20 rounded-full"
                  whileHover={{ scale: 1.05, borderColor: "rgba(36, 195, 107, 0.4)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Shield className="w-4 h-4 text-[#24C36B]" />
                  <span className="text-sm text-gray-200 font-medium">Dados 100% seguros</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Interactive Demo - Novo Layout Premium - Com overflow-visible */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative lg:pl-8 overflow-visible"
              style={{ padding: '3rem' }}
            >
              {/* Glow Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#24C36B]/20 via-transparent to-transparent blur-3xl -z-10" />
              
              {/* Main Image Container - Com espaço para elementos flutuantes */}
              <motion.div
                className="relative overflow-visible"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Decorative Border - Ajustado para não ser cortado */}
                <div className="absolute -inset-8 bg-gradient-to-r from-[#24C36B]/20 via-[#24C36B]/10 to-transparent rounded-3xl blur-2xl -z-10" />
                
                {/* Image with 3D Effect - Overflow visible para não cortar brilho */}
                <div className="relative rounded-3xl shadow-2xl shadow-[#24C36B]/20 border border-[#24C36B]/10 overflow-visible">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#24C36B]/5 to-transparent rounded-3xl" />
                  <img 
                    src="/mockup-mozeli.webp" 
                    alt="Dashboard ZapCorte - Sistema de Agendamento" 
                    className="w-full h-auto relative z-10 transform hover:scale-105 transition-transform duration-700 rounded-3xl"
                  />
                </div>

                {/* Floating Elements Redesenhados - Com z-index correto */}
                <motion.div
                  className="absolute -top-6 -right-6 bg-gradient-to-br from-[#24C36B] to-[#1ea557] text-black px-6 py-3 rounded-2xl shadow-2xl shadow-[#24C36B]/40 backdrop-blur-sm border border-[#24C36B]/20 z-20"
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <div>
                      <div className="text-xs font-medium opacity-80">Crescimento</div>
                      <div className="text-lg font-bold">+40%</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -left-6 bg-white text-black px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-200 z-20"
                  animate={{ 
                    y: [0, 8, 0],
                    rotate: [0, -2, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#24C36B]" />
                    <div>
                      <div className="text-xs font-medium text-gray-600">Menos ligações</div>
                      <div className="text-lg font-bold text-[#24C36B]">-80%</div>
                    </div>
                  </div>
                </motion.div>

                {/* Novo Badge - Clientes Satisfeitos - Oculto em mobile */}
                <motion.div
                  className="hidden lg:block absolute top-1/2 -right-8 bg-black/80 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#24C36B]/30 z-20"
                  animate={{ 
                    x: [0, 5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-[#24C36B] border-2 border-black" />
                      <div className="w-6 h-6 rounded-full bg-[#1ea557] border-2 border-black" />
                      <div className="w-6 h-6 rounded-full bg-[#24C36B] border-2 border-black" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Barbeiros ativos</div>
                      <div className="text-sm font-bold text-[#24C36B]">500+</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Decorative Dots Pattern */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 opacity-20">
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#24C36B]"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-[#27272A] bg-[#0C0C0C]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-gray-300 text-lg mb-2">Junte-se a centenas de barbeiros que já modernizaram seus negócios</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#24C36B]">500+</div>
                <div className="text-sm text-gray-400">Barbeiros</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#24C36B]">10k+</div>
                <div className="text-sm text-gray-400">Agendamentos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#24C36B]">4.9</div>
                <div className="text-sm text-gray-400">Avaliação</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-32 bg-gradient-to-b from-[#0C0C0C] via-[#18181B] to-[#0C0C0C] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#24C36B]/10 border border-[#24C36B]/20 rounded-full mb-6"
            >
              <AlertCircle className="w-5 h-5 text-[#24C36B]" />
              <span className="text-[#24C36B] text-sm font-semibold">Problemas Comuns</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Cansado desses problemas?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Você não está sozinho. Veja o que outros barbeiros enfrentam diariamente:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                Icon: Phone, 
                title: "Ligações constantes", 
                desc: "Interrompem seus atendimentos o dia todo",
                color: "text-red-400",
                bgColor: "bg-red-500/10",
                borderColor: "border-red-500/20",
                hoverBorder: "hover:border-red-400/50"
              },
              { 
                Icon: Calendar, 
                title: "Agenda desorganizada", 
                desc: "Caderno cheio de rasuras e confusão",
                color: "text-orange-400",
                bgColor: "bg-orange-500/10",
                borderColor: "border-orange-500/20",
                hoverBorder: "hover:border-orange-400/50"
              },
              { 
                Icon: UserX, 
                title: "Clientes faltando", 
                desc: "Horários vazios por esquecimento",
                color: "text-pink-400",
                bgColor: "bg-pink-500/10",
                borderColor: "border-pink-500/20",
                hoverBorder: "hover:border-pink-400/50"
              },
              { 
                Icon: Clock, 
                title: "Perda de tempo", 
                desc: "Horas confirmando agendamentos manualmente",
                color: "text-purple-400",
                bgColor: "bg-purple-500/10",
                borderColor: "border-purple-500/20",
                hoverBorder: "hover:border-purple-400/50"
              },
              { 
                Icon: TrendingDown, 
                title: "Dinheiro na mesa", 
                desc: "Perde clientes que não conseguem agendar",
                color: "text-yellow-400",
                bgColor: "bg-yellow-500/10",
                borderColor: "border-yellow-500/20",
                hoverBorder: "hover:border-yellow-400/50"
              },
              { 
                Icon: Frown, 
                title: "Estresse desnecessário", 
                desc: "Gestão manual é cansativa e ineficiente",
                color: "text-blue-400",
                bgColor: "bg-blue-500/10",
                borderColor: "border-blue-500/20",
                hoverBorder: "hover:border-blue-400/50"
              }
            ].map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className={`bg-[#18181B]/80 backdrop-blur-sm border-2 ${problem.borderColor} ${problem.hoverBorder} transition-all duration-300 h-full group`}>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <motion.div 
                        className={`w-20 h-20 ${problem.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <problem.Icon className={`w-10 h-10 ${problem.color}`} strokeWidth={2} />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-3 text-white">
                        {problem.title}
                      </h3>
                      <p className="text-gray-400 text-base leading-relaxed">
                        {problem.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <p className="text-2xl text-gray-300 mb-8">
              Chega de sofrer com esses problemas! 🚀
            </p>
            <Button 
              size="lg" 
              className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-bold px-10 py-7 text-xl rounded-2xl shadow-2xl shadow-[#24C36B]/20 hover:shadow-[#24C36B]/40 transition-all group"
              asChild
            >
              <Link to="/register">
                Resolver Agora Grátis
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="funcionalidades" className="py-32 bg-gradient-to-b from-[#0C0C0C] via-[#18181B] to-[#0C0C0C] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-40 right-20 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-40 left-20 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#24C36B]/10 border border-[#24C36B]/20 rounded-full mb-6"
            >
              <CheckCircle className="w-5 h-5 text-[#24C36B]" />
              <span className="text-[#24C36B] text-sm font-semibold">Funcionalidades</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              A solução completa para sua barbearia
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Tudo que você precisa em um só lugar, simples e profissional
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                Icon: Globe,
                title: "Página Personalizada",
                desc: "Seu link único com logo e cores da sua marca",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              },
              {
                Icon: Calendar,
                title: "Agenda Inteligente",
                desc: "Horários disponíveis em tempo real, sem conflitos",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              },
              {
                Icon: MessageSquare,
                title: "WhatsApp Automático",
                desc: "Confirmações e lembretes enviados automaticamente",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              },
              {
                Icon: Users,
                title: "Gestão de Clientes",
                desc: "Carteira organizada com histórico completo",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              },
              {
                Icon: BarChart3,
                title: "Dashboard Completo",
                desc: "Métricas e estatísticas do seu negócio",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              },
              {
                Icon: Smartphone,
                title: "100% Mobile",
                desc: "Funciona perfeitamente em qualquer dispositivo",
                gradient: "from-[#24C36B]/20 to-[#1ea557]/10"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border-2 border-[#24C36B]/20 hover:border-[#24C36B]/50 transition-all duration-300 h-full group`}>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <motion.div 
                        className="w-20 h-20 bg-[#24C36B]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.Icon className="w-10 h-10 text-[#24C36B]" strokeWidth={2} />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-3 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-base leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <Button 
              size="lg" 
              className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-bold px-10 py-7 text-xl rounded-2xl shadow-2xl shadow-[#24C36B]/20 hover:shadow-[#24C36B]/40 transition-all group"
              asChild
            >
              <Link to="/register">
                Começar Agora Grátis
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-32 bg-gradient-to-b from-[#0C0C0C] via-[#18181B] to-[#0C0C0C] relative overflow-x-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-[#24C36B]/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 overflow-visible">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#24C36B]/10 border border-[#24C36B]/20 rounded-full mb-6"
            >
              <Star className="w-5 h-5 text-[#24C36B]" />
              <span className="text-[#24C36B] text-sm font-semibold">Por Que Escolher</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Por que barbeiros escolhem o ZapCorte?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Resultados comprovados que transformam seu negócio
            </p>
          </motion.div>

          {/* Content with Mockup Centered */}
          <div className="relative w-full min-h-[600px] flex items-center justify-center">
            {/* Mockup Central - Desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="hidden lg:flex justify-center items-center"
            >
              <motion.img 
                src="/MOCKUP-APP.png" 
                alt="ZapCorte App Mockup" 
                className="w-full max-w-2xl h-auto drop-shadow-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Floating Badges - Desktop (fora da imagem) */}
            <motion.div
                className="hidden lg:block absolute top-0 left-0 bg-gradient-to-br from-[#24C36B] to-[#1ea557] text-black px-6 py-4 rounded-2xl shadow-2xl max-w-xs z-20"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                animate={{ y: [0, -10, 0] }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">+40%</div>
                    <div className="text-sm font-semibold">mais agendamentos</div>
                  </div>
                </div>
                <p className="text-sm text-black/70 font-medium">Clientes agendam 24/7</p>
              </motion.div>

            <motion.div
                className="hidden lg:block absolute top-32 right-0 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl max-w-xs z-20"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                animate={{ y: [0, 10, 0] }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#24C36B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#24C36B]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">-80%</div>
                    <div className="text-sm font-semibold">menos ligações</div>
                  </div>
                </div>
                <p className="text-sm text-black/60 font-medium">Sem interrupções</p>
              </motion.div>

            <motion.div
                className="hidden lg:block absolute bottom-32 left-0 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-[#24C36B]/40 max-w-xs z-20"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
                animate={{ y: [0, -8, 0] }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#24C36B]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-[#24C36B]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#24C36B]">5 min</div>
                    <div className="text-sm font-semibold">para configurar</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 font-medium">Rápido e fácil</p>
              </motion.div>

            <motion.div
                className="hidden lg:block absolute bottom-0 right-0 bg-gradient-to-br from-[#1a3a2a] to-[#0f2419] text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-[#24C36B]/40 max-w-xs z-20"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.6 }}
                animate={{ y: [0, 8, 0] }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#24C36B]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-[#24C36B]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#24C36B]">100%</div>
                    <div className="text-sm font-semibold">seguro</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 font-medium">Dados protegidos</p>
              </motion.div>

            {/* Mobile Version - Stacked */}
            <div className="lg:hidden space-y-6 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex justify-center mb-8"
              >
                <img 
                  src="/MOCKUP-APP.png" 
                  alt="ZapCorte App Mockup" 
                  className="w-full max-w-xs h-auto drop-shadow-2xl"
                />
              </motion.div>

              <div className="grid gap-4 px-2">
                {[
                  { Icon: TrendingUp, value: "+40%", label: "mais agendamentos", desc: "Clientes agendam 24/7", bg: "bg-gradient-to-br from-[#24C36B] to-[#1ea557]", textColor: "text-black" },
                  { Icon: Clock, value: "-80%", label: "menos ligações", desc: "Sem interrupções", bg: "bg-white", textColor: "text-black" },
                  { Icon: Zap, value: "5 min", label: "para configurar", desc: "Rápido e fácil", bg: "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]", textColor: "text-white", border: true },
                  { Icon: Shield, value: "100%", label: "seguro", desc: "Dados protegidos", bg: "bg-gradient-to-br from-[#1a3a2a] to-[#0f2419]", textColor: "text-white", border: true }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`${item.bg} ${item.textColor} px-6 py-5 rounded-2xl shadow-xl ${item.border ? 'border-2 border-[#24C36B]/40' : ''}`}
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-12 h-12 ${item.textColor === 'text-black' ? 'bg-black/10' : 'bg-[#24C36B]/20'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <item.Icon className={`w-6 h-6 ${item.textColor === 'text-black' ? 'text-black' : 'text-[#24C36B]'}`} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <div className="text-sm font-semibold">{item.label}</div>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${item.textColor === 'text-black' ? 'text-black/60' : 'text-gray-300'}`}>{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Como funciona?</h2>
            <p className="text-xl text-gray-300">3 passos simples para transformar sua barbearia</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Crie sua conta grátis", desc: "Cadastro em menos de 2 minutos, sem cartão de crédito", icon: UserPlus },
              { step: "2", title: "Configure sua barbearia", desc: "Adicione serviços, horários e personalize sua página", icon: Globe },
              { step: "3", title: "Compartilhe seu link", desc: "Envie para clientes e comece a receber agendamentos", icon: MessageSquare }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 bg-[#24C36B] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-black">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400 text-lg">{step.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-4 w-8 h-8 text-[#24C36B]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Redesenhado com Layout Moderno */}
      <section id="depoimentos" className="py-24 bg-gradient-to-b from-[#0C0C0C] via-[#18181B] to-[#0C0C0C] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#24C36B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#24C36B]/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#24C36B]/10 border border-[#24C36B]/20 rounded-full mb-6"
            >
              <Star className="w-4 h-4 text-[#24C36B] fill-[#24C36B]" />
              <span className="text-sm text-[#24C36B] font-semibold">Avaliação 4.9 ⭐⭐⭐⭐⭐</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Barbeiros <span className="text-[#24C36B]">reais</span>, resultados <span className="text-[#24C36B]">reais</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Veja como o ZapCorte está transformando barbearias em todo Brasil
            </p>
          </motion.div>

          {/* Grid de Depoimentos - 2 colunas em desktop */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#24C36B]/20 hover:border-[#24C36B]/50 transition-all duration-300 h-full shadow-xl hover:shadow-2xl hover:shadow-[#24C36B]/20">
                  <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-[#24C36B] fill-[#24C36B]" />
                      ))}
                    </div>

                    {/* Highlight Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#24C36B]/10 border border-[#24C36B]/30 rounded-full mb-4 self-start">
                      <Zap className="w-3 h-3 text-[#24C36B]" />
                      <span className="text-xs font-bold text-[#24C36B]">{testimonial.highlight}</span>
                    </div>

                    {/* Depoimento */}
                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-6 flex-grow">
                      {testimonial.text}
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t border-[#24C36B]/10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#24C36B] to-[#1ea557] flex items-center justify-center text-black font-bold text-lg shadow-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testimonial.name}</p>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <p className="text-gray-300 text-lg mb-6">
              Junte-se a <span className="text-[#24C36B] font-bold">centenas de barbeiros</span> que já transformaram seus negócios
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#24C36B] to-[#1ea557] hover:from-[#1ea557] hover:to-[#24C36B] text-black font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#24C36B]/30 hover:shadow-[#24C36B]/50 transition-all group" 
              asChild
            >
              <Link to="/register">
                Experimentar Grátis
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Planos que cabem no seu bolso</h2>
            <p className="text-xl text-gray-300">Comece grátis e faça upgrade quando quiser</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto overflow-visible">
            {[
              {
                name: "Grátis",
                price: "0",
                period: "/mês",
                description: "Perfeito para começar",
                features: [
                  "Até 5 agendamentos por dia",
                  "Máximo 4 serviços",
                  "Página personalizada",
                  "Gestão de serviços",
                  "Dashboard básico",
                  "Suporte por email"
                ],
                cta: "Começar Grátis",
                highlighted: false
              },
              {
                name: "Starter",
                price: "49,90",
                oldPrice: "97,00",
                period: "/mês",
                description: "Ideal para barbeiros autônomos",
                features: [
                  "1 profissional",
                  "Agendamentos ilimitados",
                  "Serviços ilimitados",
                  "WhatsApp integrado",
                  "Mensagens automáticas",
                  "Gestão de clientes",
                  "Lembretes automáticos",
                  "Suporte prioritário"
                ],
                cta: "Assinar Starter",
                highlighted: true,
                paymentLink: "https://pay.cakto.com.br/3th8tvh"
              },
              {
                name: "Pro",
                price: "99,90",
                period: "/mês",
                description: "Para barbearias com equipe",
                features: [
                  "Tudo do Starter",
                  "Até 10 barbeiros",
                  "Agenda individual por barbeiro",
                  "Cliente escolhe o barbeiro",
                  "Horários personalizados",
                  "Relatórios por profissional",
                  "WhatsApp centralizado",
                  "Suporte VIP 24/7"
                ],
                cta: "Assinar Pro",
                highlighted: false,
                comingSoon: false,
                paymentLink: "https://pay.cakto.com.br/9jk3ref"
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#24C36B] text-black px-4 py-1 rounded-full text-sm font-bold">
                      Mais Popular
                    </span>
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      EM BREVE
                    </span>
                  </div>
                )}
                <Card className={`h-full ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-[#24C36B]/10 to-[#18181B] border-[#24C36B] border-2'
                    : 'bg-[#18181B] border-[#27272A]'
                } ${plan.comingSoon ? 'opacity-75' : ''}`}>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      {plan.oldPrice && (
                        <div className="mb-2">
                          <span className="text-2xl text-gray-500 line-through">R$ {plan.oldPrice}</span>
                        </div>
                      )}
                      <span className="text-5xl font-bold">R$ {plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                      {plan.oldPrice && (
                        <div className="mt-2">
                          <span className="text-sm bg-[#24C36B]/20 text-[#24C36B] px-3 py-1 rounded-full font-bold">
                            Economize 50%
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-[#24C36B] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full py-6 text-lg font-semibold rounded-xl ${
                        plan.highlighted
                          ? 'bg-[#24C36B] hover:bg-[#1ea557] text-black'
                          : 'bg-transparent border-2 border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black'
                      }`}
                      disabled={plan.comingSoon}
                      asChild={!plan.comingSoon && !plan.paymentLink}
                    >
                      {plan.comingSoon ? (
                        <span>{plan.cta}</span>
                      ) : plan.paymentLink ? (
                        <a href={plan.paymentLink} target="_blank" rel="noopener noreferrer">{plan.cta}</a>
                      ) : (
                        <Link to="/register">{plan.cta}</Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#24C36B]/10 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para transformar sua barbearia?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Junte-se a centenas de barbeiros que já modernizaram seus negócios
            </p>
            <Button
              size="lg"
              className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-12 py-8 text-xl rounded-2xl group"
              asChild
            >
              <Link to="/register">
                Começar Grátis Agora
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <p className="text-sm text-gray-400 mt-4">Sem cartão de crédito • Configuração em 5 minutos</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#27272A] bg-[#0C0C0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            {/* Logo e Copyright */}
            <div className="flex items-center gap-3">
              <img src={logotipo} alt="ZapCorte" className="h-6 w-6 rounded-lg" />
              <span className="text-gray-400">© 2025 ZapCorte. Todos os direitos reservados.</span>
            </div>
            
            {/* Links Rápidos */}
            <div className="flex items-center gap-6 text-gray-400">
              <button onClick={() => scrollToSection('funcionalidades')} className="hover:text-[#24C36B] transition-colors">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection('planos')} className="hover:text-[#24C36B] transition-colors">
                Planos
              </button>
              <Link to="/login" className="hover:text-[#24C36B] transition-colors">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeNew;
