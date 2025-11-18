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
