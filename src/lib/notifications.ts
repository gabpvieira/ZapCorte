import logotipo from "@/assets/zapcorte-icon.png";

export async function notificarNovoAgendamento({
  playerId,
  customerName,
  scheduledAt,
}: {
  playerId: string;
  customerName: string;
  scheduledAt: string;
}) {
  const date = new Date(scheduledAt);
  const hoje = new Date().toDateString() === date.toDateString();
  const dataFormatada = date.toLocaleDateString("pt-BR");
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const titulo = "Novo agendamento!";
  const corpo = `${customerName} agendou um horário para ${hoje ? "hoje" : dataFormatada} às ${hora}.`;

  const payload = {
    app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    headings: { en: titulo },
    contents: { en: corpo },
    url: import.meta.env.VITE_ONESIGNAL_CLICK_URL || "https://zapcorte.com/painel",
    chrome_web_icon: logotipo,
  };

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${import.meta.env.VITE_ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[OneSignal v16] Notificação enviada:", data);
    return data;
  } catch (error) {
    console.error("[OneSignal v16] Falha ao enviar notificação:", error);
    throw error;
  }
}