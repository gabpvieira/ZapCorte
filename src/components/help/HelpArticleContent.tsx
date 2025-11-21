import { ChevronRight, ExternalLink } from "lucide-react";

export const HelpArticleContent = {
  setupBarbershop: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Configurando sua Barbearia</h3>
        <p className="text-muted-foreground mb-4">
          A configuração da sua barbearia é o primeiro passo para começar a receber agendamentos online.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold mb-2">1. Acesse Personalizar Barbearia</h4>
          <p className="text-sm text-muted-foreground mb-3">
            No menu lateral, clique em "Personalizar Barbearia".
          </p>
          <div className="bg-muted/30 p-4 rounded-lg">
            <code className="text-sm">Dashboard → Personalizar Barbearia</code>
          </div>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold mb-2">2. Informações Básicas</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Nome:</strong> Nome da sua barbearia</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Descrição:</strong> Breve descrição dos serviços</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Endereço:</strong> Endereço completo</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            💡 Dica: Mantenha suas informações sempre atualizadas!
          </p>
        </div>
      </div>
    </div>
  ),

  addServices: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Adicionando Serviços</h3>
        <p className="text-muted-foreground mb-4">
          Cadastre os serviços que sua barbearia oferece.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold mb-2">1. Acesse Meus Serviços</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <code className="text-sm">Dashboard → Meus Serviços → Novo Serviço</code>
          </div>
        </div>

        <div className="border-l-4 border-primary pl-4">
          <h4 className="font-semibold mb-2">2. Preencha os Dados</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Nome:</strong> Ex: Corte Masculino, Barba, Sobrancelha</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Descrição:</strong> Detalhes do serviço</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Preço:</strong> Valor em reais (R$)</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Duração:</strong> Tempo em minutos (30, 45, 60...)</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            ⚠️ Plano Free: Limite de 4 serviços. Upgrade para STARTER ou PRO para serviços ilimitados!
          </p>
        </div>
      </div>
    </div>
  ),

  connectWhatsApp: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Conectando WhatsApp</h3>
        <p className="text-muted-foreground mb-4">
          Conecte seu WhatsApp para enviar confirmações automáticas aos clientes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold mb-2">1. Acesse WhatsApp</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <code className="text-sm">Dashboard → WhatsApp</code>
          </div>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold mb-2">2. Conectar Dispositivo</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Clique em "Conectar WhatsApp" e escaneie o QR Code com seu celular:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Abra o WhatsApp no celular</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Toque em ⋮ (menu) → Aparelhos conectados</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Toque em "Conectar um aparelho"</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Escaneie o QR Code na tela</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            ✅ Após conectar, as mensagens serão enviadas automaticamente!
          </p>
        </div>
      </div>
    </div>
  ),

  manageAppointments: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Gerenciando Agendamentos</h3>
        <p className="text-muted-foreground mb-4">
          Visualize, confirme e gerencie todos os agendamentos da sua barbearia.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold mb-2">Visualizar Agendamentos</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Acesse o calendário no Dashboard ou em "Meus Agendamentos".
          </p>
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="text-sm">📅 <strong>Dashboard:</strong> Visualização do dia</p>
            <p className="text-sm">📋 <strong>Agendamentos:</strong> Lista completa</p>
          </div>
        </div>

        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold mb-2">Ações Disponíveis</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Confirmar:</strong> Confirma e notifica o cliente</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Reagendar:</strong> Altera data/hora</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Cancelar:</strong> Cancela e notifica</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Excluir:</strong> Remove permanentemente</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),

  addBarbers: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Gerenciando Barbeiros (PRO)</h3>
        <p className="text-muted-foreground mb-4">
          No Plano PRO, você pode cadastrar múltiplos barbeiros e gerenciar horários individuais.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold mb-2">1. Adicionar Barbeiro</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <code className="text-sm">Dashboard → Barbeiros → Novo Barbeiro</code>
          </div>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold mb-2">2. Informações do Barbeiro</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Nome:</strong> Nome completo do profissional</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Foto:</strong> Foto de perfil (opcional)</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span><strong>Especialidades:</strong> Serviços que realiza</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold mb-2">3. Horários Individuais</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Configure horários específicos para cada barbeiro:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="text-sm">✅ Dias de trabalho diferentes</p>
            <p className="text-sm">⏰ Horários personalizados</p>
            <p className="text-sm">🍽️ Intervalos individuais</p>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            ⭐ Recurso PRO: Calendário multi-barbeiro com alocação inteligente!
          </p>
        </div>
      </div>
    </div>
  ),

  notifications: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Notificações Push</h3>
        <p className="text-muted-foreground mb-4">
          Receba notificações em tempo real sobre novos agendamentos.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold mb-2">1. Ativar Notificações</h4>
          <div className="bg-muted/30 p-4 rounded-lg">
            <code className="text-sm">Dashboard → Notificações → Ativar</code>
          </div>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold mb-2">2. Permitir no Navegador</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Quando solicitado, clique em "Permitir" para receber notificações.
          </p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
            🔔 Funciona mesmo com o app fechado (PWA)!
          </p>
        </div>
      </div>
    </div>
  ),

  installPWA: (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Instalar como App</h3>
        <p className="text-muted-foreground mb-4">
          Instale o ZapCorte como um aplicativo no seu celular ou computador.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-semibold mb-2">No Android (Chrome)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Toque em ⋮ (menu) no navegador</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Selecione "Adicionar à tela inicial"</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Confirme a instalação</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-semibold mb-2">No iPhone (Safari)</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Toque no ícone de compartilhar</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Role e toque em "Adicionar à Tela de Início"</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5" />
              <span>Toque em "Adicionar"</span>
            </li>
          </ul>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            📱 Funciona offline e recebe notificações!
          </p>
        </div>
      </div>
    </div>
  ),
};
