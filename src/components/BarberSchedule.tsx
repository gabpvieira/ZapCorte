import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Copy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBarberAvailability, setBarberAvailability } from '@/lib/barbers-queries';
import type { Barber, BarberAvailability } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface BarberScheduleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: Barber;
  barbershopOpeningHours?: any;
}

const DAYS_OF_WEEK = [
  { day: 0, name: 'Domingo', short: 'Dom' },
  { day: 1, name: 'Segunda-feira', short: 'Seg' },
  { day: 2, name: 'Terça-feira', short: 'Ter' },
  { day: 3, name: 'Quarta-feira', short: 'Qua' },
  { day: 4, name: 'Quinta-feira', short: 'Qui' },
  { day: 5, name: 'Sexta-feira', short: 'Sex' },
  { day: 6, name: 'Sábado', short: 'Sáb' }
];

export function BarberSchedule({ open, onOpenChange, barber, barbershopOpeningHours }: BarberScheduleProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [schedule, setSchedule] = useState<Record<number, { start: string; end: string; active: boolean }>>({});

  useEffect(() => {
    if (open) {
      loadSchedule();
    }
  }, [open, barber.id]);

  const loadSchedule = async () => {
    try {
      setLoadingData(true);
      const availability = await getBarberAvailability(barber.id);
      
      const scheduleMap: Record<number, { start: string; end: string; active: boolean }> = {};
      availability.forEach(a => {
        scheduleMap[a.day_of_week] = {
          start: a.start_time,
          end: a.end_time,
          active: a.is_active
        };
      });
      
      setSchedule(scheduleMap);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const copyFromBarbershop = () => {
    if (!barbershopOpeningHours) {
      toast({
        title: 'Horários não disponíveis',
        description: 'Configure os horários da barbearia primeiro.',
        variant: 'destructive',
      });
      return;
    }

    const newSchedule: Record<number, { start: string; end: string; active: boolean }> = {};
    
    Object.entries(barbershopOpeningHours).forEach(([day, hours]: [string, any]) => {
      if (hours && hours.start && hours.end) {
        newSchedule[parseInt(day)] = {
          start: hours.start,
          end: hours.end,
          active: true
        };
      }
    });

    setSchedule(newSchedule);
    
    toast({
      title: 'Horários copiados!',
      description: 'Os horários da barbearia foram aplicados.',
    });
  };

  const toggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day]
        ? { ...prev[day], active: !prev[day].active }
        : { start: '09:00', end: '18:00', active: true }
    }));
  };

  const updateTime = (day: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
        active: true
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validar horários
      for (const [day, hours] of Object.entries(schedule)) {
        if (hours.active && hours.start >= hours.end) {
          toast({
            title: 'Horário inválido',
            description: `${DAYS_OF_WEEK[parseInt(day)].name}: horário de início deve ser menor que o de fim.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Converter para formato da API
      const availability: Omit<BarberAvailability, 'id' | 'barber_id' | 'created_at'>[] = [];
      
      Object.entries(schedule).forEach(([day, hours]) => {
        if (hours.active && hours.start && hours.end) {
          availability.push({
            day_of_week: parseInt(day),
            start_time: hours.start,
            end_time: hours.end,
            is_active: true
          });
        }
      });

      await setBarberAvailability(barber.id, availability);

      toast({
        title: 'Horários salvos!',
        description: `Horários de ${barber.name} atualizados com sucesso.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar os horários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de {barber.name}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ação rápida */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Copiar horários da barbearia</p>
                <p className="text-sm text-muted-foreground">
                  Aplicar os mesmos horários configurados na barbearia
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyFromBarbershop}
                disabled={!barbershopOpeningHours}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
            </div>

            {/* Grade de horários */}
            <div className="grid gap-3">
              {DAYS_OF_WEEK.map(({ day, name }) => {
                const daySchedule = schedule[day];
                const isActive = daySchedule?.active || false;

                return (
                  <div
                    key={day}
                    className={cn(
                      'p-4 border rounded-lg transition-all',
                      isActive ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-medium">{name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {isActive ? 'Disponível' : 'Folga'}
                        </span>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleDay(day)}
                        />
                      </div>
                    </div>

                    {isActive && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Início</Label>
                          <Input
                            type="time"
                            value={daySchedule?.start || '09:00'}
                            onChange={(e) => updateTime(day, 'start', e.target.value)}
                            step={900}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fim</Label>
                          <Input
                            type="time"
                            value={daySchedule?.end || '18:00'}
                            onChange={(e) => updateTime(day, 'end', e.target.value)}
                            step={900}
                            className="h-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dica */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Configure os dias e horários em que este barbeiro estará disponível para atendimento. 
                Dias marcados como "Folga" não aparecerão no agendamento.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Horários
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
