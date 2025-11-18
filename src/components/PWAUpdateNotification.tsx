import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle } from "lucide-react";

export function PWAUpdateNotification() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    // Escutar evento de atualização
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUpdateMessage(customEvent.detail?.message || "Atualizando...");
      setIsUpdating(true);

      // Esconder após 3 segundos
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    };

    window.addEventListener("sw-update", handleUpdate);

    return () => {
      window.removeEventListener("sw-update", handleUpdate);
    };
  }, []);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-[9999] pointer-events-none"
        >
          <div className="bg-gradient-to-r from-primary to-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{updateMessage}</p>
              <p className="text-xs opacity-90">Aguarde um momento...</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PWAUpdateSuccess() {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Verificar se acabou de atualizar
    const lastUpdate = localStorage.getItem("pwa-last-update");
    const now = Date.now();

    if (lastUpdate && now - parseInt(lastUpdate) < 5000) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }

    // Salvar timestamp da atualização
    localStorage.setItem("pwa-last-update", now.toString());
  }, []);

  return (
    <AnimatePresence>
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 right-4 z-[9999] pointer-events-none"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Atualizado com sucesso!</p>
              <p className="text-xs opacity-90">Você está na versão mais recente</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
