import { useState } from "react";
import { Bell, Calendar, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: "new_appointment" | "cancelled" | "confirmed" | "reminder";
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

// Dados mockados para demonstração visual
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "new_appointment",
    title: "Novo Agendamento",
    message: "João Silva agendou Corte + Barba para hoje às 14:00",
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
    read: false,
  },
  {
    id: "2",
    type: "confirmed",
    title: "Agendamento Confirmado",
    message: "Pedro Santos confirmou o agendamento de amanhã às 10:00",
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    read: false,
  },
  {
    id: "3",
    type: "cancelled",
    title: "Agendamento Cancelado",
    message: "Carlos Oliveira cancelou o agendamento de hoje às 16:00",
    time: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
    read: true,
  },
  {
    id: "4",
    type: "reminder",
    title: "Lembrete",
    message: "Você tem 3 agendamentos para amanhã",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    read: true,
  },
  {
    id: "5",
    type: "new_appointment",
    title: "Novo Agendamento",
    message: "Maria Costa agendou Corte Feminino para sexta-feira às 15:00",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
    read: true,
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "new_appointment":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "cancelled":
      return <X className="h-4 w-4 text-red-500" />;
    case "reminder":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "new_appointment":
      return "bg-blue-500/10 border-blue-500/20";
    case "confirmed":
      return "bg-green-500/10 border-green-500/20";
    case "cancelled":
      return "bg-red-500/10 border-red-500/20";
    case "reminder":
      return "bg-yellow-500/10 border-yellow-500/20";
    default:
      return "bg-muted";
  }
};

export const NotificationMenu = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Notificações</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
              </p>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Limpar
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está em dia!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(notification.time, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
