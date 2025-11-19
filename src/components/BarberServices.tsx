import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Scissors, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBarberServices, setBarberServices } from '@/lib/barbers-queries';
import type { Barber, Service } from '@/lib/supabase';

interface BarberServicesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: Barber;
  availableServices: Service[];
}

export function BarberServices({ open, onOpenChange, barber, availableServices }: BarberServicesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Record<string, { selected: boolean; customDuration?: number }>>({});

  useEffect(() => {
    if (open) {
      loadServices();
    }
  }, [open, barber.id]);

  const loadServices = async () => {
    try {
      setLoadingData(true);
      const barberServices = await getBarberServices(barber.id);
      
      const servicesMap: Record<string, { selected: boolean; customDuration?: number }> = {};
      barberServices.forEach(bs => {
        servicesMap[bs.service_id] = {
          selected: bs.is_available,
          customDuration: bs.custom_duration || undefined
        };
      });
      
      setSelectedServices(servicesMap);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        selected: !prev[serviceId]?.selected,
        customDuration: prev[serviceId]?.customDuration
      }
    }));
  };

  const updateCustomDuration = (serviceId: string, duration: string) => {
    const durationNum = parseInt(duration) || undefined;
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        customDuration: durationNum
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const services = Object.entries(selectedServices)
        .filter(([_, data]) => data.selected)
        .map(([serviceId, data]) => ({
          service_id: serviceId,
          is_available: true,
          custom_duration: data.customDuration
        }));

      await setBarberServices(barber.id, services);

      toast({
        title: 'Serviços atualizados!',
        description: `Serviços de ${barber.name} foram configurados com sucesso.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar os serviços.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selectedServices).filter(s => s.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Serviços de {barber.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecione os serviços que este barbeiro oferece
          </p>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contador */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div>
                <p className="font-medium">Serviços Selecionados</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCount} de {availableServices.length} serviços
                </p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {selectedCount}
              </Badge>
            </div>

            {/* Lista de serviços */}
            <div className="space-y-3">
              {availableServices.length === 0 ? (
                <div className="text-center py-12">
                  <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum serviço cadastrado na barbearia.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cadastre serviços primeiro em "Meus Serviços".
                  </p>
                </div>
              ) : (
                availableServices.map((service) => {
                  const isSelected = selectedServices[service.id]?.selected || false;
                  const customDuration = selectedServices[service.id]?.customDuration;

                  return (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isSelected ? 'bg-primary/5 border-primary/30' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleService(service.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-primary">
                                R$ {service.price.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {service.duration} min
                              </p>
                            </div>
                          </div>

                          {/* Duração customizada */}
                          {isSelected && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <Label className="text-xs font-medium mb-2 block">
                                Duração Customizada (opcional)
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="5"
                                  max="480"
                                  step="5"
                                  placeholder={`Padrão: ${service.duration} min`}
                                  value={customDuration || ''}
                                  onChange={(e) => updateCustomDuration(service.id, e.target.value)}
                                  className="h-9 max-w-[150px]"
                                />
                                <span className="text-sm text-muted-foreground">minutos</span>
                                {customDuration && customDuration !== service.duration && (
                                  <Badge variant="secondary" className="ml-auto">
                                    <Star className="h-3 w-3 mr-1" />
                                    Personalizado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Deixe em branco para usar a duração padrão ({service.duration} min)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dica */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Você pode personalizar a duração de cada serviço para este barbeiro. 
                Por exemplo, se ele é mais rápido ou mais detalhista em determinado serviço.
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
            Salvar Serviços
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
