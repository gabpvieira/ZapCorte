import { supabase } from './supabase';

// Estatísticas gerais de usuários
export async function getAdminUserStats() {
  const { data, error } = await supabase
    .from('admin_user_stats')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Estatísticas de barbearias
export async function getAdminBarbershopStats() {
  const { data, error } = await supabase
    .from('admin_barbershop_stats')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Estatísticas de agendamentos
export async function getAdminAppointmentStats() {
  const { data, error } = await supabase
    .from('admin_appointment_stats')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// MRR atual
export async function getAdminMRR() {
  const { data, error } = await supabase
    .from('admin_mrr')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Métricas de conversão
export async function getAdminConversionMetrics() {
  const { data, error } = await supabase
    .from('admin_conversion_metrics')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// Métricas diárias (últimos 90 dias)
export async function getAdminMetricsDaily(days: number = 30) {
  const { data, error } = await supabase
    .from('admin_metrics_daily')
    .select('*')
    .limit(days);

  if (error) throw error;
  return data || [];
}

// Métricas de receita mensal
export async function getAdminRevenueMetrics(months: number = 12) {
  const { data, error } = await supabase
    .from('admin_revenue_metrics')
    .select('*')
    .limit(months * 3); // 3 planos por mês

  if (error) throw error;
  return data || [];
}

// Últimos usuários cadastrados
export async function getAdminRecentUsers(limit: number = 20) {
  const { data, error } = await supabase
    .from('admin_recent_users')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Últimas transações
export async function getAdminRecentTransactions(limit: number = 20) {
  const { data, error } = await supabase
    .from('admin_recent_transactions')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Top barbearias
export async function getAdminTopBarbershops(limit: number = 10) {
  const { data, error } = await supabase
    .from('admin_top_barbershops')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Agendamentos por dia
export async function getAdminAppointmentsDaily(days: number = 30) {
  const { data, error } = await supabase
    .from('admin_appointments_daily')
    .select('*')
    .limit(days);

  if (error) throw error;
  return data || [];
}

// Buscar usuários com filtros avançados
export async function getAdminUsersFiltered(filters: {
  search?: string;
  planType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
  }

  if (filters.planType && filters.planType !== 'all') {
    query = query.eq('plan_type', filters.planType);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('subscription_status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Buscar transações com filtros
export async function getAdminTransactionsFiltered(filters: {
  planType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from('payment_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.planType && filters.planType !== 'all') {
    query = query.eq('plan_type', filters.planType);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Buscar métricas por período
export async function getAdminMetricsByPeriod(startDate: string, endDate: string) {
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { data: transactions, error: transactionsError } = await supabase
    .from('payment_history')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'completed');

  if (usersError || appointmentsError || transactionsError) {
    throw usersError || appointmentsError || transactionsError;
  }

  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return {
    newUsers: users?.length || 0,
    newAppointments: appointments?.length || 0,
    totalRevenue,
    transactions: transactions?.length || 0,
  };
}

// Buscar todos os dados do dashboard de uma vez
export async function getAdminDashboardData() {
  const [
    userStats,
    barbershopStats,
    appointmentStats,
    mrr,
    conversionMetrics,
    metricsDaily,
    revenueMetrics,
    recentUsers,
    recentTransactions,
    topBarbershops,
    appointmentsDaily,
  ] = await Promise.all([
    getAdminUserStats(),
    getAdminBarbershopStats(),
    getAdminAppointmentStats(),
    getAdminMRR(),
    getAdminConversionMetrics(),
    getAdminMetricsDaily(30),
    getAdminRevenueMetrics(12),
    getAdminRecentUsers(10),
    getAdminRecentTransactions(10),
    getAdminTopBarbershops(10),
    getAdminAppointmentsDaily(30),
  ]);

  return {
    userStats,
    barbershopStats,
    appointmentStats,
    mrr,
    conversionMetrics,
    metricsDaily,
    revenueMetrics,
    recentUsers,
    recentTransactions,
    topBarbershops,
    appointmentsDaily,
  };
}
