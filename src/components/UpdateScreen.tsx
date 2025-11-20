import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface UpdateScreenProps {
  version: string;
  onComplete: () => void;
}

export const UpdateScreen = ({ version, onComplete }: UpdateScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular progresso de atualização
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="text-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img 
            src="/zapcorte-icon.png" 
            alt="ZapCorte" 
            className="w-24 h-24 mx-auto mb-6"
          />
          
          <h1 className="text-2xl font-bold mb-2">Atualizando ZapCorte</h1>
          <p className="text-muted-foreground mb-6">
            Versão {version}
          </p>

          {/* Barra de progresso */}
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {progress < 100 ? 'Aplicando atualizações...' : 'Concluído!'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
