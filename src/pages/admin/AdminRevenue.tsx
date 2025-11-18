import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from './AdminLayout';
import {
  getAdminMRR,
  getAdminRevenueMetrics,
  getAdminRecentTransactions,
} from '@/lib/admin-queries';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportTransactionsToCSV } from '@/lib/export-utils';
import { Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminRevenue() {
  const [mrr, setMrr] = useState<any>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const [mrrData, revenueData, transactionsData] = await Promise.all([
        getAdminMRR(),
        getAdminRevenueMetrics(12),
        getAdminRecentTransactions(50),
      ]);

      setMrr(mrrData);
      setRevenueMetrics(revenueData);
      setTransactions(transactionsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de receita.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para gráfico
  const revenueChartData = revenueMetrics.reduce((acc: any[], item: any) => {
    const monthStr = format(new Date(item.month), 'MMM/yy', { locale: ptBR });
    const existing = acc.find((d) => d.month === monthStr);

    if (existing) {
      existing[item.plan_type] = item.total_revenue;
      existing.total += item.total_revenue;
    } else {
      acc.push({
        month: monthStr,
        [item.plan_type]: item.total_revenue,
        total: item.total_revenue,
      });
    }

    return acc;
  }, []).reverse();

  const handleExport = () => {
    exportTransactionsToCSV(transactions);
    toast({
      title: 'Exportado com sucesso!',
      description: `${transactions.length} transações exportadas para CSV.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { label: 'Pago', icon: CheckCircle, class: 'bg-green-500/20 text-green-400' },
      pending: { label: 'Pendente', icon: Clock, class: 'bg-yellow-500/20 text-yellow-400' },
      failed: { label: 'Falhou', icon: XCircle, class: 'bg-red-500/20 text-red-400' },
      refunded: { label: 'Reembolsado', icon: TrendingDown, class: 'bg-orange-500/20 text-orange-400' },
      cancelled: { label: 'Cancelado', icon: XCircle, class: 'bg-gray-500/20 text-gray-400' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <AdminLayout title="Receita">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-zinc-950 border-zinc-900 animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-zinc-900 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Receita">
      <div className="space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-950 border-zinc-900 hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">MRR Atual</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      R$ {mrr?.current_mrr?.toFixed(2) || '0.00'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {mrr?.paying_customers || 0} clientes pagantes
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-zinc-950 border-zinc-900 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Plano Starter</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {mrr?.starter_count || 0}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      R$ {((mrr?.starter_count || 0) * 29.9).toFixed(2)}/mês
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-zinc-950 border-zinc-900 hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Plano Pro</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {mrr?.pro_count || 0}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      R$ {((mrr?.pro_count || 0) * 49.9).toFixed(2)}/mês
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-zinc-950 border-zinc-900 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Transações</p>
                    <h3 className="text-3xl font-bold text-white mt-2">
                      {transactions.length}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Últimas 50 transações</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráfico de Receita */}
        <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-purple-500/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Receita Mensal (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `R$ ${value?.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="starter" fill="#8B5CF6" name="Starter" />
                <Bar dataKey="pro" fill="#10B981" name="Pro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Últimas Transações */}
        <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Últimas Transações</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={transactions.length === 0}
              className="border-zinc-800 hover:bg-zinc-900 hover:border-green-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 20).map((transaction, index) => {
                const statusBadge = getStatusBadge(transaction.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-green-500 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-purple-500/30">
                        {(transaction.user_name || transaction.user_email).charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {transaction.user_name || transaction.user_email}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{transaction.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge
                        className={`${
                          transaction.plan_type === 'pro'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        } border`}
                      >
                        {transaction.plan_type}
                      </Badge>

                      <Badge className={statusBadge.class}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                      </Badge>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">
                          R$ {transaction.amount?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
