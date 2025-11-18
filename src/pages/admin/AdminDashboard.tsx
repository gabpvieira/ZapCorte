import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Store,
  UserCheck,
  UserX,
  Percent,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from './AdminLayout';
import { getAdminDashboardData } from '@/lib/admin-queries';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getAdminDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum dado disponível</p>
        </div>
      </AdminLayout>
    );
  }

  const {
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
  } = data;

  // Preparar dados para gráficos
  const userGrowthData = metricsDaily.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: item.new_users,
    free: item.free_signups,
    starter: item.starter_signups,
    pro: item.pro_signups,
  })).reverse();

  const planDistributionData = [
    { name: 'Free', value: userStats.free_users, color: COLORS[0] },
    { name: 'Starter', value: userStats.starter_users, color: COLORS[1] },
    { name: 'Pro', value: userStats.pro_users, color: COLORS[2] },
  ];

  const appointmentsChartData = appointmentsDaily.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: item.total_appointments,
    confirmed: item.confirmed,
    cancelled: item.cancelled,
  })).reverse();

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="MRR"
            value={`R$ ${mrr.current_mrr?.toFixed(2) || '0.00'}`}
            subtitle={`${mrr.paying_customers || 0} clientes pagantes`}
            icon={DollarSign}
            color="from-green-500 to-emerald-500"
          />

          <MetricCard
            title="Total de Usuários"
            value={userStats.total_users}
            subtitle={`${userStats.new_today} novos hoje`}
            icon={Users}
            color="from-blue-500 to-cyan-500"
          />

          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionMetrics.conversion_rate || 0}%`}
            subtitle={`${conversionMetrics.total_conversions} conversões`}
            icon={TrendingUp}
            color="from-purple-500 to-pink-500"
          />

          <MetricCard
            title="Churn Rate (30d)"
            value={`${conversionMetrics.churn_rate_30d || 0}%`}
            subtitle={`${conversionMetrics.churns_last_30d} churns`}
            icon={UserX}
            color="from-red-500 to-orange-500"
          />

          <MetricCard
            title="Barbearias Ativas"
            value={barbershopStats.active_barbershops}
            subtitle={`${barbershopStats.total_barbershops} total`}
            icon={Store}
            color="from-indigo-500 to-purple-500"
          />

          <MetricCard
            title="Agendamentos Hoje"
            value={appointmentStats.today_appointments}
            subtitle={`${appointmentStats.month_appointments} este mês`}
            icon={Calendar}
            color="from-pink-500 to-rose-500"
          />

          <MetricCard
            title="Assinaturas Ativas"
            value={userStats.active_subscriptions}
            subtitle={`${userStats.starter_users} Starter, ${userStats.pro_users} Pro`}
            icon={UserCheck}
            color="from-teal-500 to-green-500"
          />

          <MetricCard
            title="Encaixes"
            value={appointmentStats.fit_in_appointments}
            subtitle={`${((appointmentStats.fit_in_appointments / appointmentStats.total_appointments) * 100).toFixed(1)}% do total`}
            icon={Zap}
            color="from-amber-500 to-yellow-500"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Crescimento de Usuários */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Crescimento de Usuários (30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8B5CF6" name="Total" strokeWidth={2} />
                  <Line type="monotone" dataKey="starter" stroke="#EC4899" name="Starter" strokeWidth={2} />
                  <Line type="monotone" dataKey="pro" stroke="#10B981" name="Pro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição de Planos */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Agendamentos */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Agendamentos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#8B5CF6" name="Total" />
                <Bar dataKey="confirmed" fill="#10B981" name="Confirmados" />
                <Bar dataKey="cancelled" fill="#EF4444" name="Cancelados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimos Usuários */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Últimos Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentUsers.slice(0, 5).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.plan_type === 'pro'
                            ? 'bg-purple-500/20 text-purple-400'
                            : user.plan_type === 'starter'
                            ? 'bg-pink-500/20 text-pink-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.plan_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Barbearias */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Top Barbearias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBarbershops.slice(0, 5).map((barbershop: any, index: number) => (
                  <div
                    key={barbershop.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {barbershop.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {barbershop.appointments_this_month} agendamentos este mês
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
