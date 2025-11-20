/**
 * Script para gerar agendamentos recorrentes automaticamente
 * 
 * Este script deve ser executado diariamente via cron job para:
 * 1. Buscar todos os agendamentos recorrentes ativos
 * 2. Calcular as próximas datas baseado na frequência
 * 3. Criar os agendamentos automaticamente
 * 4. Enviar lembretes via WhatsApp
 * 
 * Uso:
 * node scripts/generate-recurring-appointments.js
 * 
 * Cron (diariamente às 6h):
 * 0 6 * * * cd /path/to/project && node scripts/generate-recurring-appointments.js
 */

import { createClient } from '@supabase/supabase-js'
import { addDays, addWeeks, addMonths, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RecurringAppointment {
  id: string
  barbershop_id: string
  customer_id: string
  service_id: string
  barber_id?: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number
  time_of_day: string
  start_date: string
  end_date?: string
  is_active: boolean
  last_generated_date?: string
}

interface Customer {
  name: string
  phone: string
}

/**
 * Calcula a próxima data baseado na frequência
 */
function calculateNextDate(recurring: RecurringAppointment): Date | null {
  const today = startOfDay(new Date())
  const startDate = startOfDay(parseISO(recurring.start_date))
  
  // Se ainda não começou, retorna a data de início
  if (isBefore(today, startDate)) {
    return startDate
  }
  
  // Se já foi gerado, calcular a partir da última geração
  const baseDate = recurring.last_generated_date 
    ? parseISO(recurring.last_generated_date)
    : startDate
  
  let nextDate: Date
  
  switch (recurring.frequency) {
    case 'weekly':
      nextDate = addWeeks(baseDate, 1)
      break
    case 'biweekly':
      nextDate = addWeeks(baseDate, 2)
      break
    case 'monthly':
      nextDate = addMonths(baseDate, 1)
      break
    default:
      return null
  }
  
  // Verificar se está dentro do período
  if (recurring.end_date) {
    const endDate = parseISO(recurring.end_date)
    if (isAfter(nextDate, endDate)) {
      return null // Passou do período
    }
  }
  
  return nextDate
}

/**
 * Verifica se o agendamento já foi gerado para a data
 */
async function isAlreadyGenerated(
  recurringId: string,
  date: Date
): Promise<boolean> {
  const dateString = format(date, 'yyyy-MM-dd')
  
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('recurring_appointment_id', recurringId)
    .gte('scheduled_at', `${dateString}T00:00:00`)
    .lte('scheduled_at', `${dateString}T23:59:59`)
    .limit(1)
  
  if (error) {
    console.error('Erro ao verificar agendamento:', error)
    return false
  }
  
  return (data?.length || 0) > 0
}

/**
 * Busca informações do cliente
 */
async function getCustomer(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('name, phone')
    .eq('id', customerId)
    .single()
  
  if (error) {
    console.error('Erro ao buscar cliente:', error)
    return null
  }
  
  return data
}

/**
 * Cria um agendamento a partir do recorrente
 */
async function createAppointmentFromRecurring(
  recurring: RecurringAppointment,
  date: Date
): Promise<boolean> {
  try {
    // Buscar informações do cliente
    const customer = await getCustomer(recurring.customer_id)
    if (!customer) {
      console.error(`❌ Cliente não encontrado: ${recurring.customer_id}`)
      return false
    }
    
    // Combinar data e hora
    const dateString = format(date, 'yyyy-MM-dd')
    const scheduledAt = `${dateString}T${recurring.time_of_day}:00-03:00`
    
    // Preparar dados do agendamento
    const appointmentData: any = {
      barbershop_id: recurring.barbershop_id,
      service_id: recurring.service_id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      scheduled_at: scheduledAt,
      status: 'confirmed',
      recurring_appointment_id: recurring.id
    }
    
    // Adicionar barbeiro se especificado (Plano PRO)
    if (recurring.barber_id) {
      appointmentData.barber_id = recurring.barber_id
      console.log(`  👤 Barbeiro atribuído: ${recurring.barber_id}`)
    }
    
    // Criar agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single()
    
    if (appointmentError) {
      console.error('❌ Erro ao criar agendamento:', appointmentError)
      return false
    }
    
    console.log(`✅ Agendamento criado: ${customer.name} - ${dateString} ${recurring.time_of_day}`)
    
    // Atualizar last_generated_date
    const { error: updateError } = await supabase
      .from('recurring_appointments')
      .update({ last_generated_date: dateString })
      .eq('id', recurring.id)
    
    if (updateError) {
      console.error('⚠️ Erro ao atualizar last_generated_date:', updateError)
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error)
    return false
  }
}

/**
 * Processa um agendamento recorrente
 */
async function processRecurringAppointment(
  recurring: RecurringAppointment
): Promise<void> {
  console.log(`\n📋 Processando: ${recurring.id}`)
  
  // Calcular próxima data
  const nextDate = calculateNextDate(recurring)
  
  if (!nextDate) {
    console.log('⏭️ Sem próxima data (período encerrado ou inválido)')
    return
  }
  
  const dateString = format(nextDate, 'dd/MM/yyyy')
  console.log(`📅 Próxima data: ${dateString}`)
  
  // Verificar se deve gerar (dentro de 7 dias)
  const today = startOfDay(new Date())
  const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntil > 7) {
    console.log(`⏰ Ainda faltam ${daysUntil} dias, aguardando...`)
    return
  }
  
  if (daysUntil < 0) {
    console.log(`⚠️ Data já passou (${Math.abs(daysUntil)} dias atrás)`)
    return
  }
  
  // Verificar se já foi gerado
  const alreadyGenerated = await isAlreadyGenerated(recurring.id, nextDate)
  
  if (alreadyGenerated) {
    console.log('✓ Agendamento já foi gerado para esta data')
    return
  }
  
  // Criar agendamento
  const success = await createAppointmentFromRecurring(recurring, nextDate)
  
  if (success) {
    console.log('✅ Agendamento gerado com sucesso!')
  } else {
    console.log('❌ Falha ao gerar agendamento')
  }
}

/**
 * Função principal
 */
async function generateRecurringAppointments() {
  console.log('🚀 Iniciando geração de agendamentos recorrentes...')
  console.log(`⏰ Data/Hora: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`)
  
  try {
    // Buscar todos os agendamentos recorrentes ativos
    const { data: recurrings, error } = await supabase
      .from('recurring_appointments')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      throw error
    }
    
    if (!recurrings || recurrings.length === 0) {
      console.log('\n📭 Nenhum agendamento recorrente ativo encontrado')
      return
    }
    
    console.log(`\n📊 Total de recorrentes ativos: ${recurrings.length}`)
    
    // Processar cada recorrente
    let generated = 0
    let skipped = 0
    let errors = 0
    
    for (const recurring of recurrings) {
      try {
        const beforeCount = generated
        await processRecurringAppointment(recurring)
        
        // Verificar se foi gerado
        const nextDate = calculateNextDate(recurring)
        if (nextDate) {
          const wasGenerated = await isAlreadyGenerated(recurring.id, nextDate)
          if (wasGenerated && beforeCount === generated) {
            generated++
          } else if (!wasGenerated) {
            skipped++
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${recurring.id}:`, error)
        errors++
      }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA EXECUÇÃO')
    console.log('='.repeat(50))
    console.log(`✅ Agendamentos gerados: ${generated}`)
    console.log(`⏭️ Agendamentos ignorados: ${skipped}`)
    console.log(`❌ Erros: ${errors}`)
    console.log('='.repeat(50))
    
    console.log('\n✅ Processo concluído com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  }
}

// Executar
generateRecurringAppointments()
  .then(() => {
    console.log('\n👋 Finalizando...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro não tratado:', error)
    process.exit(1)
  })
