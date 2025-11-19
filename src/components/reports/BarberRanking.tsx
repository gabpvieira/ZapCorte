import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import type { BarberMetrics } from '@/lib/reports-queries';

interface BarberRankingProps {
  ranking: BarberMetrics[];
  sortBy: 'appointments' | 'revenue' | 'completion';
}

export function BarberRanking({ ranking, sortBy }: BarberRankingProps) {
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getMedalBadge = (position: number) => {
    switch (position) {
      case 0:
        return <Badge className="bg-yellow-500">🥇 1º Lugar</Badge>;
      case 1:
        return <Badge className="bg-gray-400">🥈 2º Lugar</Badge>;
      case 2:
        return <Badge className="bg-amber-600">🥉 3º Lugar</Badge>;
      default:
        return <Badge variant="outline">{position + 1}º</Badge>;
    }
  };

  const getValue = (metrics: BarberMetrics) => {
    switch (sortBy) {
      case 'revenue':
        return `R$ ${metrics.totalRevenue.toFixed(2)}`;
      case 'completion':
        return `${metrics.completionRate.toFixed(1)}%`;
      default:
        return `${metrics.totalAppointments} agendamentos`;
    }
  };

  const getLabel = () => {
    switch (sortBy) {
      case 'revenue':
        return 'Faturamento';
      case 'completion':
        return 'Taxa de Conclusão';
      default:
        return 'Total de Agendamentos';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Ranking de Performance - {getLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.map((barber, index) => {
            const initials = barber.barberName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const isTopThree = index < 3;

            return (
              <div
                key={barber.barberId}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isTopThree
                    ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20 shadow-sm'
                    : 'bg-card'
                }`}
              >
                {/* Posição e Medalha */}
                <div className="flex items-center justify-center w-12">
                  {getMedalIcon(index) || (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barber.barberPhoto || undefined} alt={barber.barberName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{barber.barberName}</p>
                    {getMedalBadge(index)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getValue(barber)}
                  </p>
                </div>

                {/* Métricas adicionais */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Agendamentos</p>
                    <p className="font-semibold">{barber.totalAppointments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Faturamento</p>
                    <p className="font-semibold">R$ {barber.totalRevenue.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Conclusão</p>
                    <p className="font-semibold">{barber.completionRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
