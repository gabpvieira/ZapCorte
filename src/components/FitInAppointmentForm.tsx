import { useState, useEffect } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Barber {
  id: string;
  name: string;
  photo_url?: string;
}

interface FitInAppointmentFormProps {
  services: Service[];
  customers: Customer[];
  barbers?: Barber[];
  isPro?: boolean;
  onSubmit: (data: {
    customer_name: string;
    customer_phone: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    service_id: string;
    barber_id?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FitInAppointmentForm({
  services,
  customers,
  barbers = [],
  isPro = false,
  onSubmit,
  onCancel,
  loading = false
}: FitInAppointmentFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");

  const handleCustomerSelect = (value: string) => {
    setSelectedCustomerId(value);
    if (value === "new") {
      setCustomerName("");
      setCustomerPhone("");
    } else {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('FitInAppointmentForm - handleSubmit chamado');
    console.log('Dados:', {
      selectedDate,
      startTime,
      endTime,
      serviceId,
      customerName,
      customerPhone
    });
    
    // Validação manual com feedback
    if (!customerName || customerName.trim() === '') {
      alert('Por favor, preencha o nome do cliente');
      return;
    }
    
    if (!customerPhone || customerPhone.trim() === '') {
      alert('Por favor, preencha o telefone do cliente');
      return;
    }
    
    if (!serviceId) {
      alert('Por favor, selecione um serviço');
      return;
    }
    
    if (!selectedDate) {
      alert('Por favor, selecione uma data');
      return;
    }
    
    if (!startTime) {
      alert('Por favor, preencha a hora de início');
      return;
    }
    
    if (!endTime) {
      alert('Por favor, preencha a hora de fim');
      return;
    }

    const formattedDate = format(selectedDate, 'dd/MM/yyyy');
    
    const submitData: any = {
      customer_name: customerName,
      customer_phone: customerPhone,
      scheduled_date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      service_id: serviceId
    };
    
    // Adicionar barbeiro se selecionado (Plano PRO)
    if (isPro && selectedBarberId) {
      submitData.barber_id = selectedBarberId;
    }
    
    console.log('Chamando onSubmit com dados formatados:', submitData);
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-amber-500 rounded-full p-2 shrink-0">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
              Modo Encaixe Ativado
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Você pode agendar em qualquer horário, sem restrições. Defina manualmente o horário de início e fim do atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Cliente */}
      <div>
        <Label htmlFor="customer_select">Cliente</Label>
        <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente ou digite novo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">+ Novo Cliente</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nome do Cliente */}
      <div>
        <Label htmlFor="customer_name">Nome do Cliente</Label>
        <Input
          id="customer_name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nome completo"
          required
        />
      </div>

      {/* Telefone */}
      <div>
        <Label htmlFor="customer_phone">Telefone (WhatsApp)</Label>
        <Input
          id="customer_phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          required
        />
      </div>

      {/* Serviço */}
      <div>
        <Label htmlFor="service_id">Serviço</Label>
        <Select value={serviceId} onValueChange={setServiceId} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o serviço" />
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
          <Select value={selectedBarberId || "auto"} onValueChange={(value) => setSelectedBarberId(value === "auto" ? "" : value)}>
            <SelectTrigger className="h-auto min-h-[48px] w-full">
              <div className="flex items-center gap-2 py-1 w-full overflow-hidden">
                {selectedBarberId && selectedBarberId !== "auto" ? (
                  <>
                    {barbers.find(b => b.id === selectedBarberId)?.photo_url ? (
                      <img
                        src={barbers.find(b => b.id === selectedBarberId)?.photo_url}
                        alt={barbers.find(b => b.id === selectedBarberId)?.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {barbers.find(b => b.id === selectedBarberId)?.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-sm truncate flex-1">
                      {barbers.find(b => b.id === selectedBarberId)?.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm truncate flex-1">Atribuição Automática</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2 py-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border-2 border-purple-500/30 flex-shrink-0">
                    <span className="text-xs font-semibold text-purple-500">A</span>
                  </div>
                  <span className="font-medium">Atribuição Automática</span>
                </div>
              </SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  <div className="flex items-center gap-2 py-1">
                    {barber.photo_url ? (
                      <img
                        src={barber.photo_url}
                        alt={barber.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {barber.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{barber.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Deixe em "Atribuição Automática" para o sistema escolher
          </p>
        </div>
      )}

      {/* Data */}
      <div>
        <Label htmlFor="scheduled_date">Data do Atendimento</Label>
        <Input
          id="scheduled_date"
          type="date"
          value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(new Date(e.target.value + 'T12:00:00'));
            } else {
              setSelectedDate(undefined);
            }
          }}
          required
          className="w-full"
        />
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">Hora Início</Label>
          <Input
            id="start_time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">Hora Fim</Label>
          <Input
            id="end_time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Encaixe"}
        </Button>
      </div>
    </form>
  );
}
