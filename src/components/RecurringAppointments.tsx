import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Calendar, Clock, User, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { RecurringAppointment, Customer, Service } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Barber {
  id: string;
  name: string;
  photo_url?: string;
}

interface RecurringAppointmentWithDetails extends RecurringAppointment {
  customer?: Customer;
  service?: Service;
  barber?: Barber;
}

interface RecurringAppointmentsProps {
  barbershopId: string;
  isPro?: boolean;
}

const frequencyLabels = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal"
};

const dayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function RecurringAppointments({ barbershopId, isPro = false }: RecurringAppointmentsProps) {
  const [recurringAppointments, setRecurringAppointments] = useState<RecurringAppointmentWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringAppointment | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    service_id: "",
    barber_id: "",
    frequency: "weekly" as "weekly" | "biweekly" | "monthly",
    day_of_week: "1",
    time_of_day: "14:00",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    if (barbershopId) {
      fetchData();
    }
  }, [barbershopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRecurringAppointments(),
        fetchCustomers(),
        fetchServices(),
        isPro ? fetchBarbers() : Promise.resolve()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_appointments")
        .select(`
          *,
          customer:customers(id, name, phone),
          service:services(id, name, price, duration),
          barber:barbers(id, name, photo_url)
        `)
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecurringAppointments(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos recorrentes:", error);
    }
  };

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, name, photo_url")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error("Erro ao carregar barbeiros:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      service_id: "",
      barber_id: "",
      frequency: "weekly",
      day_of_week: "1",
      time_of_day: "14:00",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: "",
      notes: ""
    });
    setEditingRecurring(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const recurringData: any = {
        barbershop_id: barbershopId,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        frequency: formData.frequency,
        day_of_week: formData.frequency !== "monthly" ? parseInt(formData.day_of_week) : null,
        time_of_day: formData.time_of_day,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
        is_active: true
      };

      // Adicionar barbeiro se Plano PRO e selecionado
      if (isPro && formData.barber_id) {
        recurringData.barber_id = formData.barber_id;
      }

      if (editingRecurring) {
        const { error } = await supabase
          .from("recurring_appointments")
          .update(recurringData)
          .eq("id", editingRecurring.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Agendamento recorrente atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("recurring_appointments")
          .insert([recurringData]);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Agendamento recorrente criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRecurringAppointments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o agendamento recorrente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (recurring: RecurringAppointment) => {
    setEditingRecurring(recurring);
    setFormData({
      customer_id: recurring.customer_id,
      service_id: recurring.service_id,
      barber_id: recurring.barber_id || "",
      frequency: recurring.frequency,
      day_of_week: recurring.day_of_week?.toString() || "1",
      time_of_day: recurring.time_of_day,
      start_date: recurring.start_date,
      end_date: recurring.end_date || "",
      notes: recurring.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recurring_appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agendamento recorrente excluído com sucesso.",
      });

      fetchRecurringAppointments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o agendamento recorrente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("recurring_appointments")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Agendamento recorrente ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      });

      fetchRecurringAppointments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const getRecurrenceDescription = (recurring: RecurringAppointment) => {
    const parts = [];
    
    if (recurring.frequency === "weekly") {
      parts.push(`Toda ${dayLabels[recurring.day_of_week || 0]}`);
    } else if (recurring.frequency === "biweekly") {
      parts.push(`A cada 2 semanas (${dayLabels[recurring.day_of_week || 0]})`);
    } else {
      parts.push("Mensalmente");
    }
    
    parts.push(`às ${recurring.time_of_day}`);
    
    return parts.join(" ");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agendamentos Recorrentes</h3>
          <p className="text-sm text-muted-foreground">
            Configure horários fixos para clientes regulares
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recorrente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecurring ? "Editar Agendamento Recorrente" : "Novo Agendamento Recorrente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Cliente *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhum cliente cadastrado. Crie um agendamento normal primeiro.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="service_id">Serviço *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Barbeiro (Plano PRO) */}
              {isPro && barbers.length > 0 && (
                <div>
                  <Label htmlFor="barber_id">Barbeiro (Opcional)</Label>
                  <Select
                    value={formData.barber_id || "auto"}
                    onValueChange={(value) => setFormData({ ...formData, barber_id: value === "auto" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Atribuição automática" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Atribuição Automática</SelectItem>
                      {barbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Barbeiro fixo para este agendamento recorrente
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="frequency">Frequência *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency !== "monthly" && (
                <div>
                  <Label htmlFor="day_of_week">Dia da Semana *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayLabels.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="time_of_day">Horário *</Label>
                <Input
                  id="time_of_day"
                  type="time"
                  value={formData.time_of_day}
                  onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Opcional</p>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Cliente prefere corte baixo"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ Como funciona:</strong> O sistema criará automaticamente os agendamentos
                  nas datas configuradas. Os lembretes serão enviados normalmente.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRecurring ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de agendamentos recorrentes */}
      {recurringAppointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum agendamento recorrente
          </h3>
          <p className="text-gray-500 mb-6">
            Configure horários fixos para clientes que vêm regularmente.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Recorrente
              </Button>
            </DialogTrigger>
          </Dialog>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {recurringAppointments.map((recurring, index) => (
            <motion.div
              key={recurring.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border-l-4 ${recurring.is_active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Cliente e Serviço */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{recurring.customer?.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {recurring.service?.name}
                        </Badge>
                        {recurring.barber && (
                          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                            {recurring.barber.name}
                          </Badge>
                        )}
                      </div>

                      {/* Recorrência */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                        <span>{getRecurrenceDescription(recurring)}</span>
                      </div>

                      {/* Período */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Início: {format(new Date(recurring.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {recurring.end_date && ` • Término: ${format(new Date(recurring.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </span>
                      </div>

                      {/* Observações */}
                      {recurring.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                          {recurring.notes}
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge variant={recurring.is_active ? "default" : "secondary"}>
                          {recurring.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {recurring.last_generated_date && (
                          <span className="text-xs text-muted-foreground">
                            Último gerado: {format(new Date(recurring.last_generated_date), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={recurring.is_active}
                        onCheckedChange={() => handleToggleActive(recurring.id, recurring.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(recurring)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este agendamento recorrente?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(recurring.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
