import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, TrendingUp, ExternalLink, AlertCircle, Eye, SquarePen, Trash2, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
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
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  
  // Dashboard render tracking removed for production
  
  // Funções para gerenciar o modal e ações
  const openViewModal = (appointment) => {
    setSelectedAppointment(appointment);
    // Inicializa campos de edição com a data/hora atuais do agendamento
    try {
      const iso = appointment.scheduled_at;
      setEditDate(format(parseISO(iso), "yyyy-MM-dd"));
      setEditTime(format(parseISO(iso), "HH:mm"));
    } catch (e) {
      // fallback simples caso o parse falhe
      const d = new Date(appointment.scheduled_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      setEditDate(`${yyyy}-${mm}-${dd}`);
      setEditTime(`${hh}:${mi}`);
    }
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

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !editDate || !editTime) return;
    setRescheduleLoading(true);
    try {
      // Monta a data/hora com fuso -03:00 e salva em ISO
      const scheduledAt = new Date(`${editDate}T${editTime}:00-03:00`);
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: scheduledAt.toISOString() })
        .eq("id", selectedAppointment.id);
      if (error) throw error;
      // Atualiza visualmente
      selectedAppointment.scheduled_at = scheduledAt.toISOString();
      refetchDashboard();
      alert("Agendamento atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao reagendar:", error);
      alert("Erro ao reagendar agendamento.");
    } finally {
      setRescheduleLoading(false);
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
      <div className="space-y-6 md:space-y-8">
        {/* Stats */}
        <div className="stats-grid grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Card className="stats-card border-2">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.monthAppointments}</p>
                </div>
                <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Serviços</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalServices}</p>
                </div>
                <Clock className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card border-2">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Plano</p>
                  <p className="text-lg md:text-xl font-bold capitalize">{stats.planType}</p>
                </div>
                <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
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
                      className="appointment-card flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-border p-4 hover:bg-gray-50 transition-colors gap-4"
                    >
                      <div className="appointment-card-content flex items-center gap-3 md:gap-4 flex-1">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                          <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm md:text-base truncate">{appointment.customer_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {appointment.service_name}
                          </p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {appointment.customer_phone}
                          </p>
                        </div>
                      </div>
                      <div className="appointment-card-actions flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <div className="text-left md:text-right">
                          <p className="font-bold text-sm md:text-base">
                            {new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <Badge
                            variant={appointment.status === "confirmed" ? "default" : appointment.status === "cancelled" ? "destructive" : "secondary"}
                            className="text-xs mt-1"
                          >
                            {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "cancelled" ? "Cancelado" : "Pendente"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(appointment)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
              
              {/* Data e Hora (Editar) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input 
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editDate ? format(new Date(`${editDate}T00:00:00`), "dd/MM/yyyy") : ""}
                  </p>
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input 
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">{editTime}</p>
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
            <Button onClick={rescheduleAppointment} disabled={rescheduleLoading}>
              {rescheduleLoading ? "Salvando..." : "Salvar alterações"}
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
