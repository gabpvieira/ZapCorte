import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Barber } from '@/lib/supabase';

interface BarberWithAvailability extends Barber {
  nextAvailableSlot?: string;
  availableSlotsCount?: number;
}

interface BarberSelectorProps {
  barbers: BarberWithAvailability[];
  selectedBarberId: string | null;
  onSelectBarber: (barberId: string | null) => void;
  loading?: boolean;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

export function BarberSelector({
  barbers,
  selectedBarberId,
  onSelectBarber,
  loading = false,
  className
}: BarberSelectorProps) {
  // Memoizar barbeiros ordenados por disponibilidade
  const sortedBarbers = useMemo(() => {
    return [...barbers].sort((a, b) => {
      // Barbeiros com horários disponíveis primeiro
      if (a.availableSlotsCount && !b.availableSlotsCount) return -1;
      if (!a.availableSlotsCount && b.availableSlotsCount) return 1;
      
      // Depois por número de slots disponíveis
      const slotsA = a.availableSlotsCount || 0;
      const slotsB = b.availableSlotsCount || 0;
      if (slotsA !== slotsB) return slotsB - slotsA;
      
      // Por último, ordem alfabética
      return a.name.localeCompare(b.name);
    });
  }, [barbers]);

  // Verificar se há barbeiros disponíveis
  const hasAvailableBarbers = useMemo(() => {
    return barbers.some(b => (b.availableSlotsCount || 0) > 0);
  }, [barbers]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Nenhum barbeiro disponível no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Escolha seu Barbeiro</h3>
          <p className="text-sm text-muted-foreground">
            {hasAvailableBarbers 
              ? 'Selecione o profissional de sua preferência'
              : 'Nenhum barbeiro disponível para esta data'
            }
          </p>
        </div>
        {selectedBarberId && (
          <Badge variant="default" className="gap-1">
            <Star className="h-3 w-3" />
            Selecionado
          </Badge>
        )}
      </div>

      {/* Grid de Barbeiros */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Opção: Qualquer Barbeiro */}
        <motion.div variants={itemVariants}>
          <Card
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              'border-2',
              selectedBarberId === null
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => onSelectBarber(null)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">
                    Qualquer Barbeiro
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Mais rápido! Primeiro horário disponível
                  </p>
                  {hasAvailableBarbers && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Disponível agora
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Barbeiros Individuais */}
        {sortedBarbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          const hasSlots = (barber.availableSlotsCount || 0) > 0;
          const isDisabled = !hasSlots;

          return (
            <motion.div key={barber.id} variants={itemVariants}>
              <Card
                className={cn(
                  'transition-all duration-200',
                  'border-2',
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-lg',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => !isDisabled && onSelectBarber(barber.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Foto do Barbeiro */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted">
                      {barber.photo_url ? (
                        <img
                          src={barber.photo_url}
                          alt={barber.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {barber.name}
                      </h4>

                      {/* Especialidades */}
                      {barber.specialties && barber.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {barber.specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {specialty}
                            </Badge>
                          ))}
                          {barber.specialties.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              +{barber.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Disponibilidade */}
                      {hasSlots ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            {barber.nextAvailableSlot || 'Disponível'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Sem horários hoje
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info adicional */}
      {!hasAvailableBarbers && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 <strong>Dica:</strong> Tente selecionar outra data para ver mais horários disponíveis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
