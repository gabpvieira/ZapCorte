import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, XCircle, AlertCircle, Info, Bell } from "lucide-react";
import { useEffect } from "react";

// Função para tocar som de notificação
const playNotificationSound = (variant?: string) => {
  try {
    // Criar contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar som baseado no tipo
    switch (variant) {
      case 'success':
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'destructive':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'warning':
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      default:
        oscillator.frequency.value = 700;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (error) {
    // Silenciar erro se áudio não estiver disponível
  }
};

// Ícones por variante
const getIcon = (variant?: string) => {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-[#00C853] flex-shrink-0" />;
    case 'destructive':
      return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-[#FFC107] flex-shrink-0" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    default:
      return <Bell className="h-5 w-5 text-primary flex-shrink-0" />;
  }
};

// Componente individual de Toast com som
function ToastItem({ id, title, description, action, variant, ...props }: any) {
  // Tocar som quando o toast é montado
  useEffect(() => {
    playNotificationSound(variant);
  }, [variant]);

  return (
    <Toast key={id} variant={variant} {...props}>
      <div className="flex items-start gap-3 w-full">
        {getIcon(variant)}
        <div className="grid gap-1 flex-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
      </div>
      {action}
      <ToastClose />
    </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
