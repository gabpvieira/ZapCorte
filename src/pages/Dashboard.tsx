import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, TrendingUp, ExternalLink, AlertCircle, Eye, SquarePen, Trash2, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, barbershop, services, loading: userLoading, error: userError, refetch: refetchUser } = useUserData();
  const { stats, todayAppointments, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData(barbershop?.id);
  
  // Estados para o modal e ações
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notesUpdateLoading, setNotesUpdateLoading] = useState(false);
  
  // Dashboard render tracking removed for production
  
  // Funções para gerenciar o modal e ações
  const openViewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };
  
  const closeViewModal = () => {
    setSelectedAppointment(null);
    setViewModalOpen(false);
  };
  
  const updateAppointmentStatus = async (newStatus) => {
    if (!selectedAppointment) return;
    
    setStatusUpdateLoading(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar status');
      
      // Atualizar o agendamento localmente
      selectedAppointment.status = newStatus;
      refetchDashboard();
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do agendamento');
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  const updateAppointmentNotes = async (notes) => {
    if (!selectedAppointment) return;
    
    setNotesUpdateLoading(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar observações');
      
      // Atualizar o agendamento localmente
      selectedAppointment.notes = notes;
      refetchDashboard();
      
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      alert('Erro ao atualizar observações do agendamento');
    } finally {
      setNotesUpdateLoading(false);
    }
  };
  
  const deleteAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Erro ao excluir agendamento');
      
      refetchDashboard();
      closeViewModal();
      
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      alert('Erro ao excluir agendamento');
    }
  };

  // Se autenticacao finalizou e não há usuário, redireciona para login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (userError || dashboardError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar dados</h1>
          <p className="text-muted-foreground mb-4">{userError || dashboardError}</p>
          <Button onClick={() => {
            if (userError) refetchUser();
            if (dashboardError) refetchDashboard();
          }}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            Parece que sua barbearia ainda não foi configurada. Entre em contato com o suporte.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Bem-vindo de volta!"
      action={
        <Button asChild>
          <Link to={`/barbershop/${barbershop.slug}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Meu Site
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-3xl font-bold">{stats.monthAppointments}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Serviços</p>
                  <p className="text-3xl font-bold">{stats.totalServices}</p>
                </div>
                <Clock className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-xl font-bold capitalize">{stats.planType}</p>
                </div>
                <User className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => {
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{appointment.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service_name} • {appointment.customer_phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold">
                            {new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <Badge
                            variant={appointment.status === "confirmed" ? "default" : appointment.status === "cancelled" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "cancelled" ? "Cancelado" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(appointment)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Info */}
        {barbershop.plan_type === "freemium" && (
          <div className="space-y-4">
            {/* Limites de Serviços */}
            <Card className={`border-2 ${stats.planLimits?.currentServices >= stats.planLimits?.maxServices ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-900/90'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-white">
                      Serviços Cadastrados
                    </h3>
                    <p className="text-sm text-gray-300">
                      {stats.planLimits?.currentServices} de {stats.planLimits?.maxServices} serviços cadastrados
                    </p>
                    {!stats.planLimits?.canCreateService && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Limite de serviços atingido! Faça upgrade para adicionar mais.
                      </p>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    variant={stats.planLimits?.canCreateService ? "default" : "destructive"}
                    disabled={!stats.planLimits?.canCreateService}
                    asChild
                  >
                    <Link to="/plan">
                      Fazer Upgrade
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Modal de Visualização Detalhada */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as informações do agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Informações do Cliente */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedAppointment.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{selectedAppointment.customer_phone}</span>
                </div>
              </div>
              
              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input 
                    value={new Date(selectedAppointment.scheduled_at).toLocaleDateString('pt-BR')} 
                    disabled 
                  />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input 
                    value={new Date(selectedAppointment.scheduled_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 
                    disabled 
                  />
                </div>
              </div>
              
              {/* Serviço */}
              <div>
                <Label>Serviço</Label>
                <Input value={selectedAppointment.service_name} disabled />
              </div>
              
              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedAppointment.status} 
                  onValueChange={updateAppointmentStatus}
                  disabled={statusUpdateLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Textarea 
                  placeholder="Adicione observações sobre este agendamento..."
                  defaultValue={selectedAppointment.notes || ''}
                  onBlur={(e) => updateAppointmentNotes(e.target.value)}
                  disabled={notesUpdateLoading}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeViewModal}>
              Fechar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAppointment(selectedAppointment?.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
