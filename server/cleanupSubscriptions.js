/**
 * Limpeza de Subscriptions Antigas
 * Remove subscriptions inativas ou expiradas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Remove subscriptions inativas há mais de 30 dias
 */
export async function cleanupInactiveSubscriptions() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('is_active', false)
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('Erro ao limpar subscriptions:', error);
      return { success: false, error };
    }

    console.log(`🧹 Limpeza concluída: ${data?.length || 0} subscriptions removidas`);
    return { success: true, removed: data?.length || 0 };
  } catch (error) {
    console.error('Erro ao limpar subscriptions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove subscriptions não usadas há mais de 90 dias
 */
export async function cleanupOldSubscriptions() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .lt('last_used_at', ninetyDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('Erro ao limpar subscriptions antigas:', error);
      return { success: false, error };
    }

    console.log(`🧹 Limpeza de antigas concluída: ${data?.length || 0} subscriptions removidas`);
    return { success: true, removed: data?.length || 0 };
  } catch (error) {
    console.error('Erro ao limpar subscriptions antigas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Executa limpeza completa
 */
export async function runCleanup() {
  console.log('🧹 Iniciando limpeza de subscriptions...');
  
  const inactive = await cleanupInactiveSubscriptions();
  const old = await cleanupOldSubscriptions();
  
  console.log('✅ Limpeza concluída:', {
    inactive: inactive.removed || 0,
    old: old.removed || 0,
    total: (inactive.removed || 0) + (old.removed || 0)
  });
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanup().then(() => process.exit(0));
}
