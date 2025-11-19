import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import type { BarberMetrics } from '@/lib/reports-queries';

interface BarberMetricsCardProps {
  metrics: BarberMetrics;
}

export function BarberMetricsCard({ metrics }: BarberMetricsCardProps) {
  const initials = metrics.barberName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={metrics.barberPhoto || undefined} alt={metrics.barberName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{metrics.barberName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {metrics.totalAppointments} agendamentos
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" />
              Concluídos
            </div>
            <p className="text-lg font-semibold text-green-600">
              {metrics.completedAppointments}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <XCircle className="w-3 h-3" />
              Cancelados
            </div>
            <p className="text-lg font-semibold text-red-600">
              {metrics.cancelledAppointments}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              Faturamento
            </div>
            <p className="text-lg font-semibold">
              R$ {metrics.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              Ticket Médio
            </div>
            <p className="text-lg font-semibold">
              R$ {metrics.avgTicket.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Taxa de conclusão */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Conclusão</span>
            <span className="font-semibold">{metrics.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Top serviços */}
        {metrics.topServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Serviços Mais Realizados</p>
            <div className="flex flex-wrap gap-2">
              {metrics.topServices.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service.name} ({service.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
