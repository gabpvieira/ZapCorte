import { useEffect } from 'react';
import { reminderScheduler } from '@/lib/reminderScheduler';
import { useAuth } from '@/contexts/AuthContext';

export const useReminderScheduler = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Só iniciar o scheduler se o usuário estiver logado
    if (user) {
      reminderScheduler.start();
      
      return () => {
        reminderScheduler.stop();
      };
    }
  }, [user]);

  return {
    isRunning: true, // Podemos adicionar um estado para isso se necessário
  };
};