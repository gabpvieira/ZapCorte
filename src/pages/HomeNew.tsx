import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, Users, ArrowRight, Play, CheckCircle, MessageSquare, 
  Globe, Menu, X, LogIn, UserPlus, Clock, TrendingUp, Zap,
  Smartphone, BarChart3, Shield, Star, ChevronRight, Scissors
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import logotipo from "@/assets/zapcorte-icon.png";

const HomeNew = () => {
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
      name: "Carlos Silva",
      role: "Barbearia Premium",
      text: "Triplicou meus agendamentos em 2 meses. Sistema muito fácil de usar!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Cortes Modernos",
      text: "Os lembretes automáticos reduziram 90% das faltas. Recomendo!",
      rating: 5
    },
    {
      name: "Pedro Lima",
      role: "Estilo & Barba",
      text: "Profissionalizou minha barbearia. Agora tenho controle total!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C0C0C] via-[#0C0C0C] to-[#18181B] text-white overflow-x-hidden">

      {/* Floating Header */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#0C0C0C]/90 backdrop-blur-xl border-b border-[#27272A]/50 shadow-2xl' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logotipo} alt="ZapCorte" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">ZapCorte</span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              <button onClick={() => scrollToSection('funcionalidades')} className="text-gray-300 hover:text-[#24C36B] transition-colors">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection('beneficios')} className="text-gray-300 hover:text-[#24C36B] transition-colors">
                Benefícios
              </button>
              <button onClick={() => scrollToSection('planos')} className="text-gray-300 hover:text-[#24C36B] transition-colors">
                Planos
              </button>
              <button onClick={() => scrollToSection('depoimentos')} className="text-gray-300 hover:text-[#24C36B] transition-colors">
                Depoimentos
              </button>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-300 hover:text-white" asChild>
                <Link to="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
              <Button className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold" asChild>
                <Link to="/register">Começar Grátis</Link>
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#27272A] py-4 space-y-4"
            >
              <button onClick={() => scrollToSection('funcionalidades')} className="block w-full text-left px-4 py-2 hover:bg-[#27272A] rounded-lg">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection('beneficios')} className="block w-full text-left px-4 py-2 hover:bg-[#27272A] rounded-lg">
                Benefícios
              </button>
              <button onClick={() => scrollToSection('planos')} className="block w-full text-left px-4 py-2 hover:bg-[#27272A] rounded-lg">
                Planos
              </button>
              <div className="space-y-3 pt-4 border-t border-[#27272A]">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="w-full bg-[#24C36B] hover:bg-[#1ea557] text-black" asChild>
                  <Link to="/register">Começar Grátis</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#24C36B]/10 border border-[#24C36B]/20 rounded-full"
              >
                <Zap className="w-4 h-4 text-[#24C36B]" />
                <span className="text-sm text-[#24C36B] font-medium">Mais de 500 barbeiros confiam</span>
              </motion.div>

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

              <p className="text-xl text-gray-300 leading-relaxed">
                Pare de perder tempo com ligações e mensagens. Deixe seus clientes agendarem online 24/7 enquanto você foca no que faz de melhor: cortar cabelo.
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

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#24C36B]" />
                  <span className="text-sm text-gray-300">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#24C36B]" />
                  <span className="text-sm text-gray-300">Configuração em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#24C36B]" />
                  <span className="text-sm text-gray-300">Suporte em português</span>
                </div>
              </div>
            </motion.div>

            {/* Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <motion.div
                className="bg-gradient-to-br from-[#18181B] to-[#27272A] rounded-3xl p-8 shadow-2xl border border-[#27272A]"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* [PLACEHOLDER: Screenshot do Dashboard] */}
                <div className="aspect-video bg-[#0C0C0C] rounded-xl flex items-center justify-center border border-[#27272A]">
                  <div className="text-center space-y-2">
                    <Calendar className="w-16 h-16 text-[#24C36B] mx-auto" />
                    <p className="text-gray-400">Dashboard Preview</p>
                  </div>
                </div>

                {/* Floating Stats */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-[#24C36B] text-black px-4 py-2 rounded-xl shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="text-sm font-semibold">+40% agendamentos</div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white text-black px-4 py-2 rounded-xl shadow-lg"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <div className="text-sm font-semibold">-80% ligações</div>
                </motion.div>
              </motion.div>
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
      <section className="py-20 bg-[#18181B]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Cansado desses problemas?</h2>
            <p className="text-xl text-gray-300">Você não está sozinho. Veja o que outros barbeiros enfrentam:</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📞", title: "Ligações constantes", desc: "Interrompem seus atendimentos o dia todo" },
              { icon: "📝", title: "Agenda desorganizada", desc: "Caderno cheio de rasuras e confusão" },
              { icon: "❌", title: "Clientes faltando", desc: "Horários vazios por esquecimento" },
              { icon: "⏰", title: "Perda de tempo", desc: "Horas confirmando agendamentos manualmente" },
              { icon: "💸", title: "Dinheiro na mesa", desc: "Perde clientes que não conseguem agendar" },
              { icon: "😰", title: "Estresse desnecessário", desc: "Gestão manual é cansativa e ineficiente" }
            ].map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-[#0C0C0C] border-[#27272A] hover:border-red-500/50 transition-colors h-full">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{problem.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                    <p className="text-gray-400">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">A solução completa para sua barbearia</h2>
            <p className="text-xl text-gray-300">Tudo que você precisa em um só lugar</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Página Personalizada",
                desc: "Seu link único com logo e cores da sua marca",
                color: "text-blue-400"
              },
              {
                icon: Calendar,
                title: "Agenda Inteligente",
                desc: "Horários disponíveis em tempo real, sem conflitos",
                color: "text-green-400"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Automático",
                desc: "Confirmações e lembretes enviados automaticamente",
                color: "text-purple-400"
              },
              {
                icon: Users,
                title: "Gestão de Clientes",
                desc: "Carteira organizada com histórico completo",
                color: "text-yellow-400"
              },
              {
                icon: BarChart3,
                title: "Dashboard Completo",
                desc: "Métricas e estatísticas do seu negócio",
                color: "text-red-400"
              },
              {
                icon: Smartphone,
                title: "100% Mobile",
                desc: "Funciona perfeitamente em qualquer dispositivo",
                color: "text-cyan-400"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="bg-gradient-to-br from-[#18181B] to-[#0C0C0C] border-[#27272A] hover:border-[#24C36B]/50 transition-all h-full">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 ${feature.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <feature.icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-400">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-[#18181B]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">Por que barbeiros escolhem o ZapCorte?</h2>
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "+40% mais agendamentos", desc: "Clientes agendam 24/7, mesmo quando você está ocupado" },
                  { icon: Clock, title: "-80% menos ligações", desc: "Pare de ser interrompido durante os atendimentos" },
                  { icon: Zap, title: "5 minutos para configurar", desc: "Comece a receber agendamentos hoje mesmo" },
                  { icon: Shield, title: "100% seguro e confiável", desc: "Seus dados e dos seus clientes protegidos" }
                ].map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 bg-[#24C36B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-[#24C36B]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-gray-400">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* [PLACEHOLDER: Imagem de barbeiro usando o sistema] */}
              <div className="aspect-square bg-gradient-to-br from-[#24C36B]/20 to-transparent rounded-3xl flex items-center justify-center border border-[#27272A]">
                <Scissors className="w-32 h-32 text-[#24C36B]/30" />
              </div>
            </motion.div>
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

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-[#18181B]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">O que barbeiros dizem sobre nós</h2>
            <p className="text-xl text-gray-300">Depoimentos reais de quem já transformou seu negócio</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-[#18181B] to-[#0C0C0C] border-[#27272A]">
                <CardContent className="p-12 text-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-2xl text-gray-300 mb-8 italic">"{testimonials[currentTestimonial].text}"</p>
                  <div>
                    <p className="text-xl font-semibold">{testimonials[currentTestimonial].name}</p>
                    <p className="text-gray-400">{testimonials[currentTestimonial].role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === currentTestimonial ? 'bg-[#24C36B] w-8' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Planos que cabem no seu bolso</h2>
            <p className="text-xl text-gray-300">Comece grátis e faça upgrade quando quiser</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Freemium",
                price: "0",
                period: "/mês",
                description: "Perfeito para começar",
                features: [
                  "Agendamentos ilimitados",
                  "Página personalizada",
                  "Gestão de serviços",
                  "Dashboard básico",
                  "Suporte por email"
                ],
                cta: "Começar Grátis",
                highlighted: false
              },
              {
                name: "Premium",
                price: "29,90",
                period: "/mês",
                description: "Mais popular entre barbeiros",
                features: [
                  "Tudo do Freemium",
                  "WhatsApp integrado",
                  "Mensagens automáticas",
                  "Gestão de clientes",
                  "Lembretes automáticos",
                  "Suporte prioritário",
                  "Sem anúncios"
                ],
                cta: "Assinar Premium",
                highlighted: true
              },
              {
                name: "Pro",
                price: "69,90",
                period: "/mês",
                description: "Para barbearias maiores",
                features: [
                  "Tudo do Premium",
                  "Múltiplos profissionais",
                  "Relatórios avançados",
                  "API personalizada",
                  "Integrações avançadas",
                  "Suporte VIP 24/7"
                ],
                cta: "Assinar Pro",
                highlighted: false
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
                <Card className={`h-full ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-[#24C36B]/10 to-[#18181B] border-[#24C36B] border-2'
                    : 'bg-[#18181B] border-[#27272A]'
                }`}>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">R$ {plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
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
                      asChild
                    >
                      <Link to="/register">{plan.cta}</Link>
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
      <footer className="py-12 border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logotipo} alt="ZapCorte" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">ZapCorte</span>
            </div>
            <div className="flex gap-6 text-gray-400">
              <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
              <Link to="/register" className="hover:text-white transition-colors">Cadastrar</Link>
              <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            </div>
            <p className="text-gray-400 text-sm">© 2025 ZapCorte. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeNew;
