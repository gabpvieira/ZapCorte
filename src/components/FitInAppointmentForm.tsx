import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
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

interface FitInAppointmentFormProps {
  services: Service[];
  customers: Customer[];
  onSubmit: (data: {
    customer_name: string;
    customer_phone: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    service_id: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FitInAppointmentForm({
  services,
  customers,
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
    
    console.log('Chamando onSubmit com dados formatados:', {
      customer_name: customerName,
      customer_phone: customerPhone,
      scheduled_date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      service_id: serviceId
    });
    
    onSubmit({
      customer_name: customerName,
      customer_phone: customerPhone,
      scheduled_date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      service_id: serviceId
    });
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

      {/* Data */}
      <div>
        <Label>Data do Atendimento</Label>
        <DatePicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          placeholder="Selecione a data"
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
