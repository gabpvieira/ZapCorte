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

  const currentPlan = barbershop?.plan_type || profile?.plan_type || 'freemium';
  
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
      price: 'R$ 30/mês',
      features: [
        'Agendamentos ilimitados',
        'Serviços ilimitados',
        'Domínio personalizado',
        'WhatsApp integrado',
        'Suporte básico',
        'Relatórios básicos'
      ]
    },
    pro: {
      maxAppointmentsPerDay: 999,
      maxServices: 999,
      name: 'Pro',
      price: 'R$ 69/mês',
      features: [
        'Tudo do Starter',
        'Integrações automáticas',
        'Suporte Prioritário',
        'Relatórios avançados',
        'API personalizada'
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
                  <p className="text-lg font-bold capitalize">{currentPlan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="text-lg font-bold">{planLimits[currentPlan as keyof typeof planLimits]?.price}</p>
                </div>
              </div>
              
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
                  className={`plan-card p-4 md:p-6 rounded-lg border-2 mobile-full-width w-full max-w-full overflow-hidden ${
                    currentPlan === planKey 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="plan-card-header text-center mb-4">
                    <h3 className="plan-card-title text-lg md:text-xl font-bold">{plan.name}</h3>
                    <p className="plan-card-price text-xl md:text-2xl font-bold text-primary mt-2">{plan.price}</p>
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