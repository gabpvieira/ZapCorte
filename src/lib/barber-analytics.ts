import { supabase } from './supabase';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, format } from 'date-fns';

// ==================== TYPES ====================

export interface BarberMetrics {
  barberId: string;
  barberName: string;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  averageTicket: number;
  attendanceRate: number;
  cancellationRate: number;
  topServices: Array<{
    serviceName: string;
    count: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  weekdayDistribution: Array<{
    dayOfWeek: number;
    count: number;
  }>;
}

export interface Barbe