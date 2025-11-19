import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Crown, Lock, Edit, Clock, Scissors, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserData } from '@/hooks/useUserData';
import { usePlanLimits, getPlanLimitMessage } from '@/hooks/usePlanLimits';
import { getBarbersByBarbershop, countActiveBarbers, createBarber, updateBarber, deleteBarber } from '@/lib/barbers-queries';
import type { Barber } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { BarberForm } from '@/components/BarberForm';
import { BarberSchedule } from '@/components/BarberSchedule';
import { BarberServices } from '@/components/BarberServices';

const Barbers = () => {
  const navigate = useNavigate();
  const { barbershop, services, loading } = useUserData();
  const planLimits = usePlanLimits(barbershop);
  const { toast } = useToast();
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  
  // Modais
  const [formOpen, setFormOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  useEffect(() => {
    loadBarbers();
  }, [barbershop]);

  const loadBarbers = async () => {
    if (!barbershop) return;
    
    try {
      setLoadingBarbers(true);
      const [barbersData, count] = await Promise.all([
        getBarbersByBarbershop(barbershop.id),
        countActiveBarbers(barbershop.id)
      ]);
      
      setBarbers(barbersData);
      setActiveCount(count);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os barbeiros.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBarbers(false);
    }
  };

  const handleAddBarber = () => {
    if (!planLimits.canAddBarbers) {
      toast({
        title: 'Upgrade Necessário',
        description: getPlanLimitMessage(barbershop?.plan_type || 'freemium'),
        variant: 'destructive',
      });
      return;
    }

    if (activeCount >= planLimits.maxBarbers) {
      toast({
        title: 'Limite Atingido',
        description: `Você atingiu o limite de ${planLimits.maxBarbers} barbeiros ativos no Plano ${planLimits.planName}.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedBarber(null);
    setFormOpen(true);
  };

  const handleEditBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setFormOpen(true);
  };

  const handleScheduleBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setScheduleOpen(true);
  };

  const handleServicesBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setServicesOpen(true);
  };

  const handleDeleteBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBarber) return;

    try {
      await deleteBarber(selectedBarber.id);
      toast({
        title: 'Barbeiro removido',
        description: `${selectedBarber.name} foi removido com sucesso.`,
      });
      loadBarbers();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message || 'Não foi possível remover o barbeiro.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBarber(null);
    }
  };

  const handleSaveBarber = async (data: Partial<Barber>) => {
    if (!barbershop) return;

    if (selectedBarber) {
      // Editar
      await updateBarber(selectedBarber.id, data);
    } else {
      // Criar
      await createBarber({
        ...data,
        barbershop_id: barbershop.id,
        is_active: true,
        display_order: barbers.length,
      } as any);
    }

    loadBarbers();
  };

  if (loading || loadingBarbers) {
    return (
      <DashboardLayout title="Barbeiros" subtitle="Gerenciar equipe">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Verificar se tem acesso ao Plano PRO
  if (!planLimits.canAddBarbers) {
    return (
      <DashboardLayout title="Barbeiros" subtitle="Gerenciar equipe">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Recurso Exclusivo do Plano PRO</h2>
              <p className="text-muted-foreground mb-6">
                Gerencie múltiplos barbeiros e organize sua equipe com o Plano PRO.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Benefícios do Plano PRO
              </h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Até 10 barbeiros na equipe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Horários personalizados por barbeiro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Cliente escolhe o barbeiro preferido</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Relatórios individuais de performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>WhatsApp centralizado da barbearia</span>
                </li>
              </ul>
            </div>

            <Button size="lg" onClick={() => navigate('/upgrade')}>
              <Crown className="mr-2 h-5 w-5" />
              Fazer Upgrade para PRO
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Apenas R$ 99,90/mês
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Barbeiros"
      subtitle="Gerenciar equipe"
      action={
        <Button onClick={handleAddBarber}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Barbeiro
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header com estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barbeiros Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeCount} / {planLimits.maxBarbers}
              </div>
              <p className="text-xs text-muted-foreground">
                {planLimits.maxBarbers - activeCount} vagas disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{planLimits.planName}</div>
              <p className="text-xs text-muted-foreground">
                Até {planLimits.maxBarbers} barbeiros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Barbeiros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barbers.length}</div>
              <p className="text-xs text-muted-foreground">
                {barbers.filter(b => !b.is_active).length} inativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de barbeiros */}
        {barbers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum barbeiro cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando os profissionais da sua equipe.
              </p>
              <Button onClick={handleAddBarber}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Barbeiro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <Card key={barber.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {barber.photo_url ? (
                        <img
                          src={barber.photo_url}
                          alt={barber.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold truncate">{barber.name}</h3>
                        <Badge variant={barber.is_active ? 'default' : 'secondary'}>
                          {barber.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      {barber.specialties && barber.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {barber.specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {barber.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{barber.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {barber.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {barber.bio}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleEditBarber(barber)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleScheduleBarber(barber)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Horários
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleServicesBarber(barber)}>
                              <Scissors className="mr-2 h-4 w-4" />
                              Serviços
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteBarber(barber)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <BarberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        barber={selectedBarber}
        onSave={handleSaveBarber}
      />

      {selectedBarber && (
        <>
          <BarberSchedule
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            barber={selectedBarber}
            barbershopOpeningHours={barbershop?.opening_hours}
          />

          <BarberServices
            open={servicesOpen}
            onOpenChange={setServicesOpen}
            barber={selectedBarber}
            availableServices={services}
          />
        </>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Barbeiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{selectedBarber?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Barbers;
