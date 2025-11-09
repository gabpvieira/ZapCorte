export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string;
  isActive: boolean;
  planType: 'freemium' | 'starter' | 'pro';
  monthlyAppointmentCount: number;
}

export interface Appointment {
  id: string;
  barbershopId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Mock Barbershop Data
export const mockBarbershop: Barbershop = {
  id: '1',
  name: 'Barbearia Premium',
  slug: 'barbearia-premium',
  logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop',
  bannerUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=400&fit=crop',
  isActive: true,
  planType: 'freemium',
  monthlyAppointmentCount: 5,
};

// Mock Services
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Corte Masculino',
    description: 'Corte tradicional com acabamento perfeito',
    price: 35,
    duration: 30,
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Barba',
    description: 'Aparar e modelar barba com navalha',
    price: 25,
    duration: 20,
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Corte + Barba',
    description: 'Pacote completo para um visual renovado',
    price: 50,
    duration: 45,
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Degradê',
    description: 'Corte degradê com transição perfeita',
    price: 40,
    duration: 35,
    imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop',
  },
];

// Mock Time Slots
export const mockTimeSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: false },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: false },
  { time: '15:00', available: true },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
  { time: '17:30', available: false },
  { time: '18:00', available: true },
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: '1',
    barbershopId: '1',
    serviceId: '1',
    customerName: 'João Silva',
    customerPhone: '(11) 98765-4321',
    scheduledAt: new Date(2025, 9, 31, 10, 0),
    status: 'confirmed',
  },
  {
    id: '2',
    barbershopId: '1',
    serviceId: '3',
    customerName: 'Pedro Santos',
    customerPhone: '(11) 99876-5432',
    scheduledAt: new Date(2025, 9, 31, 14, 30),
    status: 'confirmed',
  },
  {
    id: '3',
    barbershopId: '1',
    serviceId: '2',
    customerName: 'Lucas Oliveira',
    customerPhone: '(11) 97654-3210',
    scheduledAt: new Date(2025, 9, 31, 17, 30),
    status: 'pending',
  },
];

// Plans Data
export const plans = [
  {
    name: 'Freemium',
    price: 0,
    period: 'para sempre',
    appointmentsLimit: '10 agendamentos/mês',
    features: [
      'Minisite personalizado',
      'Até 10 agendamentos por mês',
      'Catálogo de serviços',
      'Agenda online',
      'Link personalizado',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 29.90,
    period: '/mês',
    appointmentsLimit: 'Agendamentos ilimitados',
    features: [
      'Tudo do Freemium',
      'Agendamentos ilimitados',
      'Domínio personalizado',
      'Remoção da marca ZapCorte',
      'Suporte por email',
    ],
    cta: 'Iniciar Teste Grátis',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 59.90,
    period: '/mês',
    appointmentsLimit: 'Tudo ilimitado + Automações',
    features: [
      'Tudo do Starter',
      'Lembretes automáticos WhatsApp',
      'Múltiplos barbeiros',
      'Analytics avançado',
      'Suporte prioritário',
      'Integrações personalizadas',
    ],
    cta: 'Falar com Vendas',
    highlighted: false,
  },
];
