import { useMemo } from 'react';
import type { Barbershop } from '@/lib/supabase';

export interface PlanLimits {
  maxBarbers: number;
  canAddBarbers: boolean;
  hasMultipleBarbers: boolean;
  planName: string;
  features: {
    multipleBarbers: boolean;
    barberSchedules: boolean;
    barberReports: boolean;
    centralizedWhatsApp: boolean;
  };
}

export function usePlanLimits(barbershop: Barbershop | null): PlanLimits {
  return useMemo(() => {
    if (!barbershop) {
      return {
        maxBarbers: 0,
        canAddBarbers: false,
        hasMultipleBarbers: false,
        planName: 'Nenhum',
        features: {
          multipleBarbers: false,
          barberSchedules: false,
          barberReports: false,
          centralizedWhatsApp: false,
        },
      };
    }

    const planType = barbershop.plan_type;

    switch (planType) {
      case 'freemium':
        return {
          maxBarbers: 0,
          canAddBarbers: false,
          hasMultipleBarbers: false,
          planName: 'Gratuito',
          features: {
            multipleBarbers: false,
            barberSchedules: false,
            barberReports: false,
            centralizedWhatsApp: false,
          },
        };

      case 'starter':
        return {
          maxBarbers: 0,
          canAddBarbers: false,
          hasMultipleBarbers: false,
          planName: 'Starter',
          features: {
            multipleBarbers: false,
            barberSchedules: false,
            barberReports: false,
            centralizedWhatsApp: false,
          },
        };

      case 'pro':
        return {
          maxBarbers: 10,
          canAddBarbers: true,
          hasMultipleBarbers: true,
          planName: 'PRO',
          features: {
            multipleBarbers: true,
            barberSchedules: true,
            barberReports: true,
            centralizedWhatsApp: true,
          },
        };

      default:
        return {
          maxBarbers: 0,
          canAddBarbers: false,
          hasMultipleBarbers: false,
          planName: 'Desconhecido',
          features: {
            multipleBarbers: false,
            barberSchedules: false,
            barberReports: false,
            centralizedWhatsApp: false,
          },
        };
    }
  }, [barbershop]);
}

export function getPlanLimitMessage(planType: string): string {
  switch (planType) {
    case 'freemium':
    case 'starter':
      return 'Faça upgrade para o Plano PRO para adicionar múltiplos barbeiros à sua equipe.';
    case 'pro':
      return 'Você pode adicionar até 10 barbeiros no Plano PRO.';
    default:
      return 'Plano desconhecido.';
  }
}
