import { useEffect } from 'react';
import { reminderScheduler } from '@/lib/reminderScheduler';
import { useAuth } from '@/contexts/AuthContext';

export const useReminderScheduler = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Só iniciar o scheduler se o usuário estiver logado
    if (user) {
      // Usar setTimeout para não bloquear a renderização inicial
      const timeoutId = setTimeout(() => {
        try {
          reminderScheduler.start();
        } catch (error) {
          console.error('Erro ao iniciar scheduler:', error);
        }
      }, 2000); // Aguardar 2 segundos após o login
      
      return () => {
        clearTimeout(timeoutId);
        try {
          reminderScheduler.stop();
        } catch (error) {
          console.error('Erro ao parar scheduler:', error);
        }
      };
    }
  }, [user]);

  return {
    isRunning: true,
  };
};