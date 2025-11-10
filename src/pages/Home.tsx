"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, ArrowRight, Play, CheckCircle, MessageSquare, Globe, Menu, X, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import logotipo from "@/assets/zapcorte-icon.png";

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [consultPhone, setConsultPhone] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll effects for floating header and progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setIsScrolled(scrollTop > 50);
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setMobileMenuOpen(false);
  };

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Barbeiro Premium",
      avatar: "CS",
      text: "Triplicou meus agendamentos em 2 meses. Sistema muito fácil de usar!"
    },
    {
      name: "João Santos",
      role: "Barbearia Moderna",
      avatar: "JS", 
      text: "Os lembretes automáticos reduziram 90% das faltas. Recomendo!"
    },
    {
      name: "Pedro Lima",
      role: "Cortes & Estilo",
      avatar: "PL",
      text: "Profissionalizou minha barbearia. Agora tenho controle total!"
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
    viewport: { once: true }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-white overflow-x-hidden">
      {/* Floating Header with State Transitions */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Full-width background when not scrolled */}
        <div className={`transition-all duration-500 ease-in-out ${
          isScrolled 
            ? 'bg-transparent' 
            : 'w-full bg-[#0C0C0C] border-b border-[#27272A]'
        }`}>
          
          {/* Floating container when scrolled */}
          <div className={`transition-all duration-500 ease-in-out relative ${
            isScrolled 
              ? 'max-w-5xl mx-auto my-3 mx-4 sm:mx-6 lg:mx-8 bg-[#0C0C0C]/90 backdrop-blur-xl border border-[#27272A]/50 rounded-2xl shadow-2xl shadow-black/30' 
              : 'w-full max-w-7xl mx-auto'
          }`}>
            {/* Scroll Progress Indicator */}
            <div className={`absolute bottom-0 left-0 h-0.5 bg-[#24C36B] transition-all duration-300 ease-out ${
              isScrolled ? 'rounded-full' : ''
            }`}
                 style={{ width: `${scrollProgress}%` }} />
            
            <div className={`transition-all duration-500 ${
              isScrolled 
                ? 'px-6 sm:px-8' 
                : 'px-4 sm:px-6 lg:px-8'
            }`}>
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <img
                  src={logotipo}
                  alt="ZapCorte"
                  className="h-8 w-8 rounded-lg"
                />
                <span className="text-xl font-bold text-white">ZapCorte</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection('funcionalidades')}
                  className="text-gray-300 hover:text-[#24C36B] transition-colors font-medium"
                >
                  Funcionalidades
                </button>
                <button
                  onClick={() => scrollToSection('planos')}
                  className="text-gray-300 hover:text-[#24C36B] transition-colors font-medium"
                >
                  Planos
                </button>
                <button
                  onClick={() => scrollToSection('contato')}
                  className="text-gray-300 hover:text-[#24C36B] transition-colors font-medium"
                >
                  Contato
                </button>
              </nav>

              {/* Desktop Auth & CTA - Simplified */}
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-[#27272A] px-4 py-2 rounded-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </Link>
                </Button>

                {/* Main CTA - Always visible */}
                <Button 
                  className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-6 py-2 rounded-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/register">Começar Agora</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-[#27272A] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden border-t border-[#27272A] py-4 space-y-4"
              >
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  <button
                    onClick={() => scrollToSection('funcionalidades')}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:text-[#24C36B] hover:bg-[#27272A] rounded-lg transition-colors"
                  >
                    Funcionalidades
                  </button>
                  <button
                    onClick={() => scrollToSection('planos')}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:text-[#24C36B] hover:bg-[#27272A] rounded-lg transition-colors"
                  >
                    Planos
                  </button>
                  <button
                    onClick={() => scrollToSection('contato')}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:text-[#24C36B] hover:bg-[#27272A] rounded-lg transition-colors"
                  >
                    Contato
                  </button>
                </div>

                {/* Mobile Auth Buttons - Simplified */}
                <div className="space-y-3 pt-4 border-t border-[#27272A]">
                  <Button 
                    variant="outline"
                    className="w-full border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black py-3 rounded-xl"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/login" className="flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </Link>
                  </Button>
                  
                  <Button 
                    className="w-full bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold py-3 rounded-xl"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/register" className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Começar Agora
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Mobile-First */}
      <section id="inicio" className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#24C36B]/10 via-transparent to-transparent" />
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content - Mobile-First */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-6 lg:space-y-8"
            >
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Seu primeiro sistema de agendamento.{" "}
                <span className="text-[#24C36B]">E o único que você vai precisar.</span>
              </motion.h1>
              
              <motion.p 
                className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Crie sua barbearia online em poucos cliques, personalize com sua marca e receba agendamentos com total controle, do seu jeito.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-8 py-4 text-lg rounded-2xl w-full sm:w-auto"
                  asChild
                >
                  <Link to="/register">Começar Grátis</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black px-8 py-4 text-lg rounded-2xl w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Interactive Demo - Hidden on small screens, visible on larger */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden lg:block relative"
            >
              <motion.div 
                className="bg-gradient-to-br from-[#18181B] to-[#27272A] rounded-2xl p-6 shadow-2xl border border-[#27272A] max-w-md mx-auto"
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
              >
                {/* Header do App */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={logotipo}
                      alt="ZapCorte"
                      className="h-10 w-10 rounded-xl"
                    />
                    <div>
                      <h3 className="font-semibold text-sm">Barbearia do João</h3>
                      <p className="text-xs text-gray-400">Agendamento Online</p>
                    </div>
                  </div>
                </div>

                {/* Calendário Simplificado */}
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-gray-400 py-1">{day}</div>
                    ))}
                    {Array.from({ length: 14 }, (_, i) => {
                      const isSelected = i === 7;
                      const isAvailable = [2, 4, 6, 7, 9, 11].includes(i);
                      return (
                        <motion.div
                          key={i}
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-xs
                            ${isSelected ? 'bg-[#24C36B] text-black font-bold' : 
                              isAvailable ? 'bg-[#27272A] text-white' : 
                              'bg-[#1A1A1A] text-gray-600'}
                          `}
                          animate={isSelected ? { 
                            scale: [1, 1.1, 1]
                          } : {}}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: 1,
                            ease: "easeInOut",
                            repeatType: "reverse"
                          }}
                        >
                          {i + 1}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Horários */}
                  <div className="grid grid-cols-2 gap-2">
                    {['09:00', '10:30', '14:00', '15:30'].map((time, i) => (
                      <motion.button
                        key={time}
                        className={`
                          px-3 py-2 rounded-lg text-xs font-medium
                          ${i === 1 ? 'bg-[#24C36B] text-black' : 'bg-[#27272A] text-white'}
                        `}
                        animate={i === 1 ? {
                          scale: [1, 1.05, 1]
                        } : {}}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          delay: 2,
                          ease: "easeInOut",
                          repeatType: "reverse"
                        }}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>

                  {/* Confirmação */}
                  <motion.div
                    className="bg-[#1A1A1A] rounded-xl p-4 border border-[#27272A]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#24C36B] rounded-full flex items-center justify-center text-black font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#24C36B]">Agendamento Confirmado!</p>
                        <p className="text-xs text-gray-400">11/01 às 10:30</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof - Mobile-First */}
      <motion.section 
        className="py-8 sm:py-12 border-y border-[#27272A]"
        {...fadeInUp}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">
            +500 barbeiros já utilizam o ZapCorte diariamente
          </p>
          <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-[#27272A] rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section - Mobile-First */}
      <motion.section 
        id="funcionalidades"
        className="py-12 sm:py-16 lg:py-20"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Funcionalidades</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">Tudo que você precisa para modernizar sua barbearia</p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Seu link personalizado com logo",
                description: "Tenha sua própria URL profissional"
              },
              {
                icon: Calendar,
                title: "Agenda visual e simples",
                description: "Interface intuitiva para seus clientes"
              },
              {
                icon: MessageSquare,
                title: "Integração com WhatsApp",
                description: "Lembretes automáticos via N8n"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <Card className="bg-[#18181B] border-[#27272A] rounded-2xl hover:border-[#24C36B]/50 transition-colors h-full">
                  <CardContent className="p-6 sm:p-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#24C36B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <benefit.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#24C36B]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{benefit.title}</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works - Mobile-First */}
      <motion.section 
        className="py-12 sm:py-16 lg:py-20 bg-[#18181B]/50"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Como Funciona</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">3 passos simples para começar</p>
          </motion.div>
          
          <div className="grid gap-8 sm:gap-10 md:grid-cols-3 md:gap-12">
            {[
              {
                step: "1",
                title: "Crie sua conta",
                description: "Cadastre-se gratuitamente em menos de 2 minutos"
              },
              {
                step: "2", 
                title: "Personalize sua barbearia",
                description: "Configure seus serviços, horários e informações"
              },
              {
                step: "3",
                title: "Receba agendamentos",
                description: "Compartilhe seu link e receba agendamentos automáticos"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={{
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#24C36B] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-black">
                  {step.step}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">{step.title}</h3>
                <p className="text-gray-300 text-base sm:text-lg max-w-sm mx-auto">{step.description}</p>
                
                {/* Arrow only visible on desktop */}
                {index < 2 && (
                  <ArrowRight className="hidden lg:block absolute top-8 sm:top-10 -right-6 w-6 h-6 sm:w-8 sm:h-8 text-[#24C36B]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Consultar Agendamentos - Mobile-First */}
      <motion.section 
        className="py-12 sm:py-16 lg:py-20 bg-[#18181B]"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Consultar Meus Agendamentos</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">Digite seu telefone para visualizar seus agendamentos</p>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="tel"
                placeholder="Digite seu telefone"
                className="flex-1 px-4 py-3 rounded-lg bg-[#0C0C0C] border border-[#27272A] text-white placeholder-gray-400 focus:border-[#24C36B] focus:outline-none text-base"
                value={consultPhone}
                onChange={(e) => setConsultPhone(e.target.value)}
              />
              <Button 
                className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-6 py-3 rounded-lg w-full sm:w-auto"
                onClick={() => {
                  if (consultPhone.trim()) {
                    window.location.href = `/my-appointments?phone=${encodeURIComponent(consultPhone.trim())}`;
                  }
                }}
              >
                Consultar
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Plans - Mobile-First */}
      <motion.section 
        id="planos"
        className="py-12 sm:py-16 lg:py-20"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Planos</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">Escolha o ideal para sua barbearia</p>
          </motion.div>
          
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                name: "Freemium",
                price: "0",
                period: "/mês",
                features: [
                  "Até 5 agendamentos por dia",
                  "Máximo 4 serviços cadastrados",
                  "Link personalizado", 
                  "WhatsApp integrado",
                  "Suporte básico"
                ],
                cta: "Começar Grátis",
                highlighted: false,
                link: "/register"
              },
              {
                name: "Starter", 
                price: "30",
                period: "/mês",
                features: [
                  "Agendamentos ilimitados",
                  "Domínio personalizado",
                  "WhatsApp integrado",
                  "Suporte básico",
                  "Relatórios básicos"
                ],
                cta: "Assinar Starter",
                highlighted: true,
                link: "/register"
              },
              {
                name: "Pro",
                price: "69", 
                period: "/mês",
                features: [
                  "Tudo do Starter",
                  "Integrações automáticas",
                  "Suporte Prioritário",
                  "Relatórios avançados",
                  "API personalizada"
                ],
                cta: "Assinar Pro",
                highlighted: false,
                link: "/register"
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative md:col-span-1 lg:col-span-1"
              >
                <Card className={`bg-[#0C0C0C] rounded-2xl h-full ${
                  plan.highlighted 
                    ? 'border-[#24C36B] border-2 shadow-lg shadow-[#24C36B]/20' 
                    : 'border-[#27272A]'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-[#24C36B] text-black px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{plan.name}</h3>
                    <div className="mb-4 sm:mb-6">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">R$ {plan.price}</span>
                      <span className="text-gray-300 text-sm sm:text-base">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#24C36B] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-2xl py-4 sm:py-6 text-base sm:text-lg font-semibold ${
                        plan.highlighted
                          ? 'bg-[#24C36B] hover:bg-[#1ea557] text-black'
                          : 'bg-transparent border-[#24C36B] border-2 text-[#24C36B] hover:bg-[#24C36B] hover:text-black'
                      }`}
                      asChild={plan.name === 'Freemium'}
                    >
                      {plan.name === 'Freemium' ? (
                        <Link to={plan.link}>{plan.cta}</Link>
                      ) : (
                        <a href={plan.link} target="_blank" rel="noopener noreferrer">
                          {plan.cta}
                        </a>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials - Mobile-First */}
      <motion.section 
        className="py-12 sm:py-16 lg:py-20"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Depoimentos</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">O que nossos clientes dizem</p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <motion.div 
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Card className="bg-[#18181B] border-[#27272A] rounded-2xl">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#24C36B] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-black">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 italic leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  <h4 className="text-base sm:text-lg font-semibold">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-gray-300 text-sm sm:text-base">{testimonials[currentTestimonial].role}</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors touch-manipulation ${
                    index === currentTestimonial ? 'bg-[#24C36B]' : 'bg-[#27272A]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA - Mobile-First */}
      <motion.section 
        className="py-16 sm:py-20 lg:py-24 bg-black"
        {...fadeInUp}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Pronto para profissionalizar sua barbearia?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Leva menos de 2 minutos para começar
          </p>
          <Button 
            size="lg" 
            className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-bold px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl rounded-2xl w-full sm:w-auto"
            asChild
          >
            <Link to="/register">Criar Minha Barbearia</Link>
          </Button>
        </div>
      </motion.section>

      {/* Enhanced Footer with Contact - Mobile-First */}
      <footer id="contato" className="py-12 sm:py-16 border-t border-[#27272A]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Contact Section Header */}
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            {...fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Entre em Contato</h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Tem dúvidas? Nossa equipe está pronta para ajudar você a revolucionar sua barbearia.
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={logotipo}
                  alt="ZapCorte"
                  className="h-8 w-8 rounded-lg"
                />
                <span className="text-xl font-bold">ZapCorte</span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Sistema completo de agendamento para barbearias modernas. Profissionalize seu negócio hoje mesmo.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📧 contato@zapcorte.com</p>
                <p>📱 (11) 99999-9999</p>
                <p>🕒 Seg-Sex: 9h às 18h</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Navegação</h3>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>
                  <button 
                    onClick={() => scrollToSection('inicio')}
                    className="hover:text-[#24C36B] transition-colors touch-manipulation"
                  >
                    Início
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('funcionalidades')}
                    className="hover:text-[#24C36B] transition-colors touch-manipulation"
                  >
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('planos')}
                    className="hover:text-[#24C36B] transition-colors touch-manipulation"
                  >
                    Planos
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li><a href="#" className="hover:text-[#24C36B] transition-colors touch-manipulation">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-[#24C36B] transition-colors touch-manipulation">FAQ</a></li>
                <li><a href="#" className="hover:text-[#24C36B] transition-colors touch-manipulation">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#24C36B] transition-colors touch-manipulation">Privacidade</a></li>
              </ul>
            </div>

            {/* Social & CTA */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Conecte-se</h3>
              <div className="flex gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center hover:bg-[#24C36B] hover:text-black transition-colors cursor-pointer touch-manipulation">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center hover:bg-[#24C36B] hover:text-black transition-colors cursor-pointer touch-manipulation">
                  <span className="text-sm font-bold">@</span>
                </div>
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center hover:bg-[#24C36B] hover:text-black transition-colors cursor-pointer touch-manipulation">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
              <Button 
                className="w-full bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold py-2 rounded-xl text-sm"
                asChild
              >
                <Link to="/register">Começar Grátis</Link>
              </Button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#27272A] mt-8 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-300 text-sm sm:text-base">
              <p>&copy; 2025 ZapCorte. Todos os direitos reservados.</p>
              <p className="text-xs sm:text-sm">
                Desenvolvido com ❤️ para barbeiros modernos
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
