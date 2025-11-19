import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar } from 'lucide-react';
import { getBarbersMetrics, getBarbersRanking, getBarberTimelineData } from '@/lib/reports-queries';
import { useUserData } from '@/hooks/useUserData';
import { subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { BarberMetricsCard } from '@/components/reports/BarberMetricsCard';
import { BarberRanking } from '@/components/reports/BarberRanking';
import { ComparisonChart } from '@/components/reports/ComparisonChart';
import { ExportButton } from '@/components/reports/ExportButton';

type PeriodType = 'today' | 'week' | 'month' | 'last30';

export default function Reports() {
  const { barbershop, loading } = useUserData();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [rankingSort, setRankingSort] = useState<'appointments' | 'revenue' | 'completion'>('appointments');

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { startDate: now, endDate: now };
      case 'week':
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last30':
        return { startDate: subDays(now, 30), endDate: now };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [period]);

  // Queries
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['barbers-metrics', barbershop?.id, period],
    queryFn: () => getBarbersMetrics(barbershop!.id, dateRange),
    enabled: !!barbershop?.id,
    retry: 1,
    staleTime: 30000, // Cache por 30 segundos
  });

  const { data: ranking, isLoading: rankingLoading, error: rankingError } = useQuery({
    queryKey: ['barbers-ranking', barbershop?.id, period, rankingSort],
    queryFn: () => getBarbersRanking(barbershop!.id, dateRange, rankingSort),
    enabled: !!barbershop?.id,
    retry: 1,
    staleTime: 30000,
  });

  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = useQuery({
    queryKey: ['barbers-timeline', barbershop?.id, period],
    queryFn: () => getBarberTimelineData(barbershop!.id, dateRange),
    enabled: !!barbershop?.id,
    retry: 1,
    staleTime: 30000,
  });

  // Calcular totais gerais
  const totals = useMemo(() => {
    if (!metrics) return null;
    return {
      totalAppointments: metrics.reduce((sum, m) => sum + m.totalAppointments, 0),
      totalRevenue: metrics.reduce((sum, m) => sum + m.totalRevenue, 0),
      avgTicket: metrics.reduce((sum, m) => sum + m.avgTicket, 0) / (metrics.length || 1),
      avgCompletion: metrics.reduce((sum, m) => sum + m.completionRate, 0) / (metrics.length || 1),
    };
  }, [metrics]);

  const periodLabels = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    last30: 'Últimos 30 Dias',
  };

  if (loading || !barbershop) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (metricsError) {
    return (
      <DashboardLayout title="Relatórios" subtitle="Métricas e performance dos barbeiros">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-2">Erro ao carregar relatórios</p>
            <p className="text-sm text-muted-foreground">
              {metricsError instanceof Error ? metricsError.message : 'Erro desconhecido'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Relatórios"
      subtitle="Métricas e performance dos barbeiros"
      action={
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="last30">Últimos 30 Dias</SelectItem>
            </SelectContent>
          </Select>

          <ExportButton
            metrics={metrics || []}
            period={periodLabels[period]}
            barbershopName={barbershop.name}
          />
        </div>
      }
    >
      <div className="space-y-6">

      {/* Cards de Totais */}
      {totals && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {periodLabels[period]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Agendamentos concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.avgTicket.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por agendamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.avgCompletion.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média geral
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">
            <Users className="w-4 h-4 mr-2" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Métricas por Barbeiro */}
        <TabsContent value="metrics" className="space-y-4">
          {metricsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando métricas...</p>
            </div>
          ) : metrics && metrics.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <BarberMetricsCard key={metric.barberId} metrics={metric} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Ranking */}
        <TabsContent value="ranking" className="space-y-4">
          <div className="flex justify-end">
            <Select value={rankingSort} onValueChange={(v: any) => setRankingSort(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">Agendamentos</SelectItem>
                <SelectItem value="revenue">Faturamento</SelectItem>
                <SelectItem value="completion">Taxa de Conclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rankingLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando ranking...</p>
            </div>
          ) : ranking && ranking.length > 0 ? (
            <BarberRanking ranking={ranking} sortBy={rankingSort} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Gráficos */}
        <TabsContent value="charts" className="space-y-4">
          {timelineLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando gráficos...</p>
            </div>
          ) : (
            <ComparisonChart
              metrics={metrics || []}
              timelineData={timelineData || []}
            />
          )}
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
