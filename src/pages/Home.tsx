"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, Smartphone, Zap, Clock, Star, Users, ArrowRight, Play, CheckCircle, MessageSquare, Globe, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [consultPhone, setConsultPhone] = useState("");

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
    <div className="min-h-screen bg-[#0C0C0C] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#24C36B]/10 via-transparent to-transparent" />
        
        <div className="w-full max-w-[80%] mx-auto px-4 py-16 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Seu primeiro sistema de agendamento.{" "}
                <span className="text-[#24C36B]">E o único que você vai precisar.</span>
              </motion.h1>
              
              <motion.p 
                 className="text-lg md:text-xl text-gray-300 leading-relaxed"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.4 }}
               >
                 Crie sua barbearia online em poucos cliques, personalize com sua marca e receba agendamentos com total controle, do seu jeito.
               </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-8 py-4 text-lg rounded-2xl"
                  asChild
                >
                  <Link to="/register">Começar Grátis</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-[#24C36B] text-[#24C36B] hover:bg-[#24C36B] hover:text-black px-8 py-4 text-lg rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              {/* Simulação Interativa de Agendamento */}
              <motion.div 
                className="bg-gradient-to-br from-[#18181B] to-[#27272A] rounded-2xl p-4 shadow-2xl border border-[#27272A] overflow-hidden"
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
              >
                {/* Header do App */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#24C36B] rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Barbearia do João</h3>
                      <p className="text-xs text-gray-400">Agendamento Online</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>

                {/* Calendário Interativo */}
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-gray-400 py-1">{day}</div>
                    ))}
                    {Array.from({ length: 21 }, (_, i) => {
                      const isSelected = i === 10;
                      const isAvailable = [3, 5, 8, 10, 12, 15, 17].includes(i);
                      return (
                        <motion.div
                          key={i}
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer
                            ${isSelected ? 'bg-[#24C36B] text-black font-bold' : 
                              isAvailable ? 'bg-[#27272A] text-white hover:bg-[#3F3F46]' : 
                              'bg-[#1A1A1A] text-gray-600'}
                          `}
                          whileHover={isAvailable ? { scale: 1.1 } : {}}
                          animate={isSelected ? { 
                            scale: [1, 1.2, 1],
                            boxShadow: ["0 0 0 0 rgba(36, 195, 107, 0.7)", "0 0 0 10px rgba(36, 195, 107, 0)", "0 0 0 0 rgba(36, 195, 107, 0)"]
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

                  {/* Horários Disponíveis */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                  >
                    <p className="text-xs text-gray-400 mb-2">Horários disponíveis:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['09:00', '10:30', '14:00', '15:30', '16:00', '17:30'].map((time, i) => (
                        <motion.button
                          key={time}
                          className={`
                            px-3 py-2 rounded-lg text-xs font-medium transition-all
                            ${i === 1 ? 'bg-[#24C36B] text-black' : 'bg-[#27272A] text-white hover:bg-[#3F3F46]'}
                          `}
                          whileHover={{ scale: 1.05 }}
                          animate={i === 1 ? {
                            scale: [1, 1.1, 1],
                            backgroundColor: ["#24C36B", "#1DB954", "#24C36B"]
                          } : {}}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: 3,
                            ease: "easeInOut",
                            repeatType: "reverse"
                          }}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Confirmação do Agendamento */}
                  <motion.div
                    className="bg-[#1A1A1A] rounded-xl p-4 border border-[#27272A]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 4 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div 
                        className="w-8 h-8 bg-[#24C36B] rounded-full flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, delay: 4.5 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 5 }}
                        >
                          ✓
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="text-xs font-semibold text-[#24C36B]">Agendamento Confirmado!</p>
                        <p className="text-xs text-gray-400">11/01 às 10:30</p>
                      </div>
                    </div>
                    
                    {/* Simulação WhatsApp */}
                    <motion.div
                      className="bg-[#075E54] rounded-lg p-3 mt-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 6 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-[#25D366] rounded-full flex items-center justify-center text-xs">
                          📱
                        </div>
                        <span className="text-xs text-white font-medium">WhatsApp</span>
                      </div>
                      <motion.p 
                        className="text-xs text-white bg-[#128C7E] rounded-lg p-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 6.5 }}
                      >
                        🔔 Lembrete: Seu corte é amanhã às 10:30 na Barbearia do João!
                      </motion.p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Efeitos de Partículas */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-[#24C36B] rounded-full opacity-20"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: 1,
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#24C36B] rounded-full opacity-30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: 2,
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
       <motion.section 
         className="py-8 border-y border-[#27272A]"
         {...fadeInUp}
       >
         <div className="w-full max-w-[80%] mx-auto px-4 text-center lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <p className="text-gray-300 text-lg mb-8">
            +500 barbeiros já utilizam o ZapCorte diariamente
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="w-12 h-12 bg-[#27272A] rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Quick Benefits */}
       <motion.section 
         className="py-16"
         variants={staggerContainer}
         initial="initial"
         whileInView="whileInView"
       >
         <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                <Card className="bg-[#18181B] border-[#27272A] rounded-2xl hover:border-[#24C36B]/50 transition-colors">
                  <CardContent className="p-6 md:p-8">
                    <div className="w-16 h-16 bg-[#24C36B]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="w-8 h-8 text-[#24C36B]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                    <p className="text-gray-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
       <motion.section 
         className="py-16 bg-[#18181B]/50"
         variants={staggerContainer}
         initial="initial"
         whileInView="whileInView"
       >
         <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <motion.div variants={fadeInUp} className="text-center mb-12">
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Como Funciona</h2>
             <p className="text-lg md:text-xl text-gray-300">3 passos simples para começar</p>
           </motion.div>
          
          <div className="grid md:grid-cols-3 gap-12">
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
                  initial: { opacity: 0, x: -50 },
                  whileInView: { opacity: 1, x: 0 },
                  transition: { duration: 0.5, delay: index * 0.2 }
                }}
                className="text-center relative"
              >
                <div className="w-20 h-20 bg-[#24C36B] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-black">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-300 text-lg">{step.description}</p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-6 w-8 h-8 text-[#24C36B]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Consultar Agendamentos */}
      <motion.section 
        className="py-16 bg-[#18181B]"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Consultar Meus Agendamentos</h2>
            <p className="text-lg md:text-xl text-gray-300">Digite seu telefone para visualizar seus agendamentos</p>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="max-w-md mx-auto">
            <div className="flex gap-4">
              <input
                type="tel"
                placeholder="Digite seu telefone"
                className="flex-1 px-4 py-3 rounded-lg bg-[#0C0C0C] border border-[#27272A] text-white placeholder-gray-400 focus:border-[#24C36B] focus:outline-none"
                value={consultPhone}
                onChange={(e) => setConsultPhone(e.target.value)}
              />
              <Button 
                className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-semibold px-6"
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

      {/* Plans */}
       <motion.section 
         className="py-16 bg-[#18181B]"
         variants={staggerContainer}
         initial="initial"
         whileInView="whileInView"
       >
         <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Planos</h2>
            <p className="text-lg md:text-xl text-gray-300">Escolha o ideal para sua barbearia</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                className="relative"
              >
                <Card className={`bg-[#0C0C0C] rounded-2xl h-full ${
                  plan.highlighted 
                    ? 'border-[#24C36B] border-2 shadow-lg shadow-[#24C36B]/20' 
                    : 'border-[#27272A]'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#24C36B] text-black px-4 py-2 rounded-full text-sm font-bold">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">R$ {plan.price}</span>
                      <span className="text-gray-300">{plan.period}</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-[#24C36B] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-2xl py-6 text-lg font-semibold ${
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

      {/* Testimonials */}
       <motion.section 
         className="py-16"
         variants={staggerContainer}
         initial="initial"
         whileInView="whileInView"
       >
         <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Depoimentos</h2>
            <p className="text-lg md:text-xl text-gray-300">O que nossos clientes dizem</p>
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
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-[#24C36B] rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold text-black">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <p className="text-xl text-gray-300 mb-6 italic">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  <h4 className="text-lg font-semibold">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-gray-300">{testimonials[currentTestimonial].role}</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-[#24C36B]' : 'bg-[#27272A]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
       <motion.section 
         className="py-20 bg-black"
         {...fadeInUp}
       >
         <div className="w-full max-w-[80%] mx-auto px-4 text-center lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Pronto para profissionalizar sua barbearia?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Leva menos de 2 minutos para começar
          </p>
          <Button 
            size="lg" 
            className="bg-[#24C36B] hover:bg-[#1ea557] text-black font-bold px-12 py-6 text-xl rounded-2xl"
            asChild
          >
            <Link to="/register">Criar Minha Barbearia</Link>
          </Button>
        </div>
      </motion.section>

      {/* Footer */}
       <footer className="py-16 border-t border-[#27272A]">
         <div className="w-full max-w-[80%] mx-auto px-4 lg:max-w-[80%] md:max-w-[90%] sm:max-w-[95%]">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Sobre o ZapCorte</h3>
              <p className="text-gray-300">
                Sistema completo de agendamento para barbearias modernas.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-[#24C36B] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#24C36B] transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-[#24C36B] transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-[#24C36B] transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center hover:bg-[#24C36B] transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center hover:bg-[#24C36B] transition-colors cursor-pointer">
                  <span className="text-sm font-bold">@</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#27272A] mt-12 pt-8 text-center text-gray-300">
            <p>&copy; ZapCorte 2025. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
