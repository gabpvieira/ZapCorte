import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Store, 
  Scissors, 
  Calendar, 
  MessageCircle, 
  Bell,
  Users,
  UserCog,
  BarChart3,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HelpArticleContent } from "@/components/help/HelpArticleContent";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  articles: HelpArticle[];
  proOnly?: boolean;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  tags: string[];
  proOnly?: boolean;
}

const Help = () => {
  const { barbershop } = useUserData();
  const isPro = barbershop?.plan_type === 'pro';
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [quickGuideOpen, setQuickGuideOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [installAppOpen, setInstallAppOpen] = useState(false);

  const helpSections: HelpSection[] = [
    {
      id: "getting-started",
      title: "Primeiros Passos",
      icon: BookOpen,
      description: "Configure sua barbearia e comece a receber agendamentos",
      articles: [
        {
          id: "setup-barbershop",
          title: "Como configurar minha barbearia",
          description: "Aprenda a personalizar as informações da sua barbearia",
          tags: ["configuração", "inicial", "básico"],
          content: HelpArticleContent.setupBarbershop
        },
        {
          id: "add-services",
          title: "Como adicionar serviços",
          description: "Cadastre os serviços que sua barbearia oferece",
          tags: ["serviços", "cadastro", "preço"],
          content: HelpArticleContent.addServices
        },
        {
          id: "install-pwa",
          title: "Instalar como aplicativo",
          description: "Instale o ZapCorte no seu celular ou computador",
          tags: ["pwa", "app", "instalação"],
          content: HelpArticleContent.installPWA
        }
      ]
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      icon: MessageCircle,
      description: "Conecte e configure mensagens automáticas",
      articles: [
        {
          id: "connect-whatsapp",
          title: "Como conectar o WhatsApp",
          description: "Passo a passo para conectar seu WhatsApp",
          tags: ["whatsapp", "conexão", "qrcode"],
          content: HelpArticleContent.connectWhatsApp
        }
      ]
    },
    {
      id: "appointments",
      title: "Agendamentos",
      icon: Calendar,
      description: "Gerencie e organize seus agendamentos",
      articles: [
        {
          id: "manage-appointments",
          title: "Gerenciar agendamentos",
          description: "Como visualizar, confirmar e cancelar agendamentos",
          tags: ["agendamentos", "calendário", "confirmação"],
          content: HelpArticleContent.manageAppointments
        }
      ]
    },
    {
      id: "notifications",
      title: "Notificações",
      icon: Bell,
      description: "Receba alertas de novos agendamentos",
      articles: [
        {
          id: "enable-notifications",
          title: "Ativar notificações push",
          description: "Configure notificações em tempo real",
          tags: ["notificações", "push", "alertas"],
          content: HelpArticleContent.notifications
        }
      ]
    },
    {
      id: "pro-features",
      title: "Recursos PRO",
      icon: UserCog,
      description: "Funcionalidades exclusivas do Plano PRO",
      proOnly: true,
      articles: [
        {
          id: "add-barbers",
          title: "Gerenciar barbeiros",
          description: "Cadastre e gerencie múltiplos barbeiros",
          tags: ["barbeiros", "equipe", "pro"],
          proOnly: true,
          content: HelpArticleContent.addBarbers
        }
      ]
    }
  ];

  // Filtrar seções e artigos baseado na busca
  const filteredSections = helpSections.filter(section => {
    if (!isPro && section.proOnly) return false;
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const sectionMatch = section.title.toLowerCase().includes(query) || 
                        section.description.toLowerCase().includes(query);
    
    const articleMatch = section.articles.some(article => 
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    return sectionMatch || articleMatch;
  });

  // Filtrar artigos dentro de cada seção
  const getFilteredArticles = (section: HelpSection) => {
    if (!searchQuery) return section.articles.filter(a => isPro || !a.proOnly);
    
    const query = searchQuery.toLowerCase();
    return section.articles.filter(article => {
      if (!isPro && article.proOnly) return false;
      
      return article.title.toLowerCase().includes(query) ||
             article.description.toLowerCase().includes(query) ||
             article.tags.some(tag => tag.toLowerCase().includes(query));
    });
  };

  if (selectedArticle) {
    return (
      <DashboardLayout
        title="Central de Ajuda"
        subtitle={selectedArticle.title}
      >
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedArticle(null);
              setSelectedSection(null);
            }}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Card>
            <CardContent className="p-6 md:p-8">
              {selectedArticle.content}
            </CardContent>
          </Card>

          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ExternalLink className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Precisa de mais ajuda?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Entre em contato com nosso suporte pelo WhatsApp
                  </p>
                  <Button asChild>
                    <a 
                      href="https://chat.whatsapp.com/HqObbcQZfwn9voifcWlAHV" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Grupo de Suporte
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Central de Ajuda"
      subtitle="Encontre respostas e aprenda a usar o ZapCorte"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos de ajuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card 
            className="border-2 hover:border-primary transition-colors cursor-pointer"
            onClick={() => setQuickGuideOpen(true)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Guia Rápido</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Comece aqui se é sua primeira vez
              </p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => setSupportOpen(true)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Suporte</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fale com nossa equipe
              </p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-blue-500 transition-colors cursor-pointer sm:col-span-2 md:col-span-1"
            onClick={() => setInstallAppOpen(true)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Instalar App</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Use como aplicativo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Sections */}
        <div className="space-y-6">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const articles = getFilteredArticles(section);
            
            if (articles.length === 0) return null;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                          {section.proOnly && (
                            <Badge variant="default" className="bg-purple-500 text-xs">
                              PRO
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="grid gap-2 sm:gap-3">
                      {articles.map((article) => (
                        <motion.div
                          key={article.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <button
                            onClick={() => {
                              setSelectedArticle(article);
                              setSelectedSection(section.id);
                            }}
                            className={cn(
                              "w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all",
                              "hover:border-primary hover:bg-primary/5",
                              "flex items-start justify-between gap-2 sm:gap-4"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-sm sm:text-base">{article.title}</h4>
                                {article.proOnly && (
                                  <Badge variant="outline" className="text-xs">
                                    PRO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {article.description}
                              </p>
                              <div className="flex gap-1 sm:gap-2 mt-2 flex-wrap">
                                {article.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground rotate-180 flex-shrink-0 mt-1" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredSections.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Tente buscar com outras palavras-chave
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal Guia Rápido */}
        <Dialog open={quickGuideOpen} onOpenChange={setQuickGuideOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Guia Rápido - Primeiros Passos
              </DialogTitle>
              <DialogDescription>
                Siga estes passos para começar a usar o ZapCorte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Configure sua Barbearia</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Adicione nome, endereço, fotos e horários de funcionamento
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQuickGuideOpen(false);
                    const article = helpSections[0].articles[0];
                    setSelectedArticle(article);
                  }}
                >
                  Ver Tutorial Completo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Cadastre seus Serviços</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Adicione cortes, barba e outros serviços com preços e duração
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQuickGuideOpen(false);
                    const article = helpSections[0].articles[1];
                    setSelectedArticle(article);
                  }}
                >
                  Ver Tutorial Completo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold mb-2">3. Conecte o WhatsApp</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Envie confirmações automáticas para seus clientes
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQuickGuideOpen(false);
                    const article = helpSections[1].articles[0];
                    setSelectedArticle(article);
                  }}
                >
                  Ver Tutorial Completo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">4. Instale como App</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use o ZapCorte como aplicativo no seu celular
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQuickGuideOpen(false);
                    const article = helpSections[0].articles[2];
                    setSelectedArticle(article);
                  }}
                >
                  Ver Tutorial Completo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-primary">
                  💡 Dica: Após configurar tudo, compartilhe o link da sua barbearia com seus clientes!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Suporte */}
        <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Suporte ZapCorte
              </DialogTitle>
              <DialogDescription>
                Estamos aqui para ajudar você!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  Grupo de Suporte WhatsApp
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Entre no nosso grupo exclusivo para clientes. Tire dúvidas, compartilhe experiências e receba atualizações.
                </p>
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  asChild
                >
                  <a 
                    href="https://chat.whatsapp.com/HqObbcQZfwn9voifcWlAHV" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Entrar no Grupo
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Horário de Atendimento</h4>
                <p className="text-sm text-muted-foreground">
                  Segunda a Sexta: 9h às 18h<br />
                  Sábado: 9h às 13h
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Tempo de Resposta</h4>
                <p className="text-sm text-muted-foreground">
                  Respondemos em até 2 horas durante o horário comercial
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Instalar App */}
        <Dialog open={installAppOpen} onOpenChange={setInstallAppOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                Instalar ZapCorte como App
              </DialogTitle>
              <DialogDescription>
                Use o ZapCorte como um aplicativo nativo no seu dispositivo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Benefícios do App</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Acesso rápido direto da tela inicial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Funciona offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Recebe notificações push</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Experiência nativa como app</span>
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">📱 Android (Chrome)</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Toque em ⋮ (menu) no navegador</li>
                  <li>Selecione "Adicionar à tela inicial"</li>
                  <li>Confirme tocando em "Adicionar"</li>
                  <li>O ícone aparecerá na tela inicial</li>
                </ol>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">🍎 iPhone (Safari)</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Toque no ícone de compartilhar (quadrado com seta)</li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Edite o nome se desejar</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2">💻 Desktop (Chrome/Edge)</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Clique no ícone de instalação na barra de endereço</li>
                  <li>Ou vá em Menu → "Instalar ZapCorte"</li>
                  <li>Confirme a instalação</li>
                  <li>O app abrirá em janela própria</li>
                </ol>
              </div>

              <Button 
                className="w-full"
                onClick={() => {
                  setInstallAppOpen(false);
                  const article = helpSections[0].articles[2];
                  setSelectedArticle(article);
                }}
              >
                Ver Tutorial Completo com Imagens
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Help;
