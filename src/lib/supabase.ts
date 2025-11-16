import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Types baseados nas tabelas criadas
export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export interface Barbershop {
  id: string
  user_id: string
  name: string
  slug: string
  logo_url?: string
  banner_url?: string
  subtitle?: string
  instagram_url?: string
  whatsapp_number?: string
  maps_url?: string
  opening_hours?: {
    [key: string]: { start: string; end: string } | null
  }
  lunch_break?: {
    start: string
    end: string
    enabled: boolean
  }
  is_active: boolean
  plan_type: 'freemium' | 'starter' | 'pro'
  monthly_appointment_count: number
  created_at: string
}

export interface Service {
  id: string
  barbershop_id: string
  name: string
  description?: string
  price: number
  duration: number
  image_url?: string
  is_active: boolean
  created_at: string
}

export interface Availability {
  id: string
  barbershop_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  barbershop_id: string
  service_id: string
  customer_name: string
  customer_phone: string
  scheduled_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  recurring_appointment_id?: string
  created_at: string
}

export interface RecurringAppointment {
  id: string
  barbershop_id: string
  customer_id: string
  service_id: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number
  time_of_day: string
  start_date: string
  end_date?: string
  is_active: boolean
  last_generated_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  barbershop_id: string
  name: string
  phone: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface WebhookLog {
  id: string
  event_type: string
  payload: any
  status: 'success' | 'failed' | 'pending'
  error_message?: string
  created_at: string
}