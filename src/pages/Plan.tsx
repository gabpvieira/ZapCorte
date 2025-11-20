import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/UpgradeButton";
import { useUserData } from "@/hooks/useUserData";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Plan = () => {
  const { profile, barbershop } = useUserData();
  const { stats, loading: dashboardLoading } = useDashboardData(barbershop?.id);

  // Priorizar o plano do profile (fonte da verdade) sobre o da barbershop
  // Normalizar o nome do plano (free -> freemium, starter -> starter, pro -> pro)
  const rawPlan = profile?.plan_type || barbershop?.plan_type || 'freemium';
  const currentPlan = rawPlan === 'free' ? 'freemium' : rawPlan;
  
  const planLimits = {
    freemium: {
      maxAppointmentsPerDay: 5,
      maxServices: 4,
      name: 'Freemium',
      price: 'R$ 0',
      features: [
        'Até 5 agendamentos por dia',
        'Máximo 4 serviços cadastrados',
        'Link personalizado',
        'WhatsApp integrado',
        'Suporte básico'
      ]
    },
    starter: {
      maxAppointmentsPerDay: 999,
      maxServices: 999,
      name: 'Starter',
      price: 'R$ 49,90/mês',
      oldPrice: 'R$ 97,00',
      features: [
        '1 profissional',
        'Agendamentos ilimitados',
        'Serviços ilimitados',
        'WhatsApp integrado',
        'Mensagens automáticas',
        'Gestão de clientes',
        'Lembretes automáticos',
        'Suporte prioritário'
      ]
    },
    pro: {
      maxAppointmentsPerDay: 999,
      maxServices: 999,
      name: 'Pro',
      price: 'R$ 99,90/mês',
      features: [
        'Tudo do Starter',
        'Até 10 barbeiros',
        'Agenda individual por barbeiro',
        'Cliente escolhe o barbeiro',
        'Horários personalizados',
        'Relatórios por profissional',
        'WhatsApp centralizado',
        'Suporte VIP 24/7'
      ]
    }
  };

  return (
    <DashboardLayout
      title="Plano & Conta"
      subtitle="Gerencie seu plano e informações de assinatura"
    >
      <div className="space-y-6 w-full overflow-x-hidden">
        {/* Status do Plano Atual */}
        <div className="grid gap-6 md:grid-cols-2 w-full overflow-x-hidden">
          <Card className="border-2 w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle>Seu Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-lg font-bold capitalize">
                    {planLimits[currentPlan as keyof typeof planLimits]?.name || currentPlan}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="text-lg font-bold">{planLimits[currentPlan as keyof typeof planLimits]?.price}</p>
                </div>
              </div>
              
              {/* Indicador de Status da Assinatura */}
              {profile?.subscription_status && (
                <div className="flex items-center gap-2 pt-2">
                  {profile.subscription_status === 'active' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Assinatura Ativa</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 font-medium">
                        {profile.subscription_status === 'cancelled' ? 'Assinatura Cancelada' : 'Sem Assinatura'}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {currentPlan === 'freemium' && stats.planLimits && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Agendamentos Hoje</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      stats.planLimits.currentAppointmentsToday >= stats.planLimits.maxAppointmentsPerDay 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {stats.planLimits.currentAppointmentsToday}/{stats.planLimits.maxAppointmentsPerDay}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Serviços Cadastrados</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      stats.planLimits.currentServices >= stats.planLimits.maxServices 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {stats.planLimits.currentServices}/{stats.planLimits.maxServices}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <UpgradeButton planType="starter">
                  Fazer Upgrade
                </UpgradeButton>
                <Button variant="outline" disabled>Gerenciar Pagamento</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Email: <span className="font-semibold">{profile?.email || '-'}</span></p>
              <p className="text-sm text-muted-foreground">Status: <span className="font-semibold">{profile?.subscription_status || 'ativo'}</span></p>
              <p className="text-sm text-muted-foreground">Último pagamento: {profile?.last_payment_date ? new Date(profile.last_payment_date).toLocaleDateString('pt-BR') : '—'}</p>
              <p className="text-sm text-muted-foreground">Método: {profile?.payment_method || '—'}</p>
              <Button variant="outline" disabled className="mt-2">Atualizar Dados</Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparação de Planos */}
        <Card className="border-2 w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Compare os Planos</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-x-hidden">
            <div className="plans-grid grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full overflow-x-hidden">
              {Object.entries(planLimits).map(([planKey, plan]) => (
                <div 
                  key={planKey}
                  className={`plan-card p-4 md:p-6 rounded-lg border-2 mobile-full-width w-full max-w-full overflow-hidden relative ${
                    currentPlan === planKey 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border'
                  } ${planKey === 'pro' ? 'opacity-75' : ''}`}
                >
                  {/* Badge de Plano Atual */}
                  {currentPlan === planKey && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      ✓ Atual
                    </div>
                  )}
                  

                  
                  <div className="plan-card-header text-center mb-4">
                    <h3 className="plan-card-title text-lg md:text-xl font-bold">{plan.name}</h3>
                    {plan.oldPrice && (
                      <p className="text-sm text-muted-foreground line-through mt-1">{plan.oldPrice}</p>
                    )}
                    <p className="plan-card-price text-xl md:text-2xl font-bold text-primary mt-2">{plan.price}</p>
                    {plan.oldPrice && (
                      <span className="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">
                        Economize 50%
                      </span>
                    )}
                  </div>
                  
                  <ul className="plan-card-features space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs md:text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {currentPlan !== planKey && planKey !== 'freemium' && (
                    <UpgradeButton 
                      className="plan-card-button w-full" 
                      variant="outline"
                      planType={planKey as 'starter' | 'pro'}
                    >
                      {currentPlan === 'freemium' ? 'Assinar Agora' : 'Mudar de Plano'}
                    </UpgradeButton>
                  )}
                  
                  {currentPlan === planKey && (
                    <Button className="plan-card-button w-full" disabled>
                      Plano Atual
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Plan;