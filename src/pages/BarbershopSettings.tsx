import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useUserData } from "@/hooks/useUserData";
import { ImageUpload } from "@/components/ImageUpload";
import { uploadBarbershopLogo, uploadBarbershopBanner } from "@/lib/storage";
import { updateBarbershop, checkSlugAvailability } from "@/lib/supabase-queries";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, ExternalLink, Clock, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const BarbershopSettings = () => {
  const { barbershop, refetch } = useUserData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subtitle: "",
    instagram_url: "",
    whatsapp_number: "",
    maps_url: ""
  });
  
  const [openingHours, setOpeningHours] = useState<{
    [key: string]: { start: string; end: string } | null
  }>({});
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1,2,3,4,5]);
  const [groupStart, setGroupStart] = useState<string>("09:00");
  const [groupEnd, setGroupEnd] = useState<string>("19:00");
  const [validationError, setValidationError] = useState<string>("");
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(true);

  // Atualizar formulário quando os dados da barbearia carregarem
  useEffect(() => {
    if (barbershop) {
      setFormData({
        name: barbershop.name || "",
        slug: barbershop.slug || "",
        subtitle: barbershop.subtitle || "",
        instagram_url: barbershop.instagram_url || "",
        whatsapp_number: barbershop.whatsapp_number || "",
        maps_url: barbershop.maps_url || ""
      });
      
      // Carregar horários de funcionamento
      setOpeningHours(barbershop.opening_hours || {});
    }
  }, [barbershop]);

  // Verificar disponibilidade do slug
  const checkSlug = async (slug: string) => {
    if (!slug || slug === barbershop?.slug) {
      setSlugError("");
      setSlugAvailable(true);
      return;
    }

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Use apenas letras minúsculas, números e hífens");
      setSlugAvailable(false);
      return;
    }

    try {
      const available = await checkSlugAvailability(slug, barbershop?.id);
      setSlugAvailable(available);
      setSlugError(available ? "" : "Este link já está em uso");
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      setSlugError("Erro ao verificar disponibilidade");
      setSlugAvailable(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'slug') {
      const formattedSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, slug: formattedSlug }));
      checkSlug(formattedSlug);
    }
  };

  const handleOpeningHoursChange = (day: number, field: 'start' | 'end', value: string) => {
    setOpeningHours(prev => {
      const dayKey = day.toString();
      const currentDay = prev[dayKey] || { start: '', end: '' };
      
      // Se for vazio, define como null (fechado)
      if (!value) {
        return { ...prev, [dayKey]: null };
      }
      
      return {
        ...prev,
        [dayKey]: {
          ...currentDay,
          [field]: value
        }
      };
    });
  };

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setLogoPreview(tempUrl);
    } else {
      setLogoPreview(null);
    }
  };

  const handleBannerChange = (file: File | null) => {
    setBannerFile(file);
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setBannerPreview(tempUrl);
    } else {
      setBannerPreview(null);
    }
  };

  const toggleDayClosed = (day: number) => {
    setOpeningHours(prev => {
      const dayKey = day.toString();
      if (prev[dayKey] === null) {
        // Se estava fechado, abre com horário padrão
        const { [dayKey]: _, ...rest } = prev;
        return rest;
      } else {
        // Se estava aberto, fecha
        return { ...prev, [dayKey]: null };
      }
    });
  };

  const setDayOpen = (day: number, open: boolean) => {
    setOpeningHours(prev => {
      const dayKey = day.toString();
      if (!open) return { ...prev, [dayKey]: null };
      const current = prev[dayKey] || { start: "09:00", end: "18:00" };
      const { [dayKey]: _, ...rest } = prev;
      return { ...rest, [dayKey]: current };
    });
  };

  const toggleWeekdaySelection = (day: number) => {
    setSelectedWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const validateHours = (hours: { start: string; end: string } | null) => {
    if (!hours) return true;
    return hours.start < hours.end;
  };

  const applyGroupToSelected = () => {
    if (groupStart >= groupEnd) {
      setValidationError("Horário de início deve ser menor que o de fim.");
      return;
    }
    setValidationError("");
    setOpeningHours(prev => {
      const updated = { ...prev } as typeof prev;
      selectedWeekdays.forEach(day => {
        updated[day.toString()] = { start: groupStart, end: groupEnd };
      });
      return updated;
    });
  };

  const clearAllHours = () => {
    setOpeningHours({});
  };

  const handleSave = async () => {
    if (!barbershop) return;

    setLoading(true);
    
    try {
      let logoUrl = barbershop.logo_url;
      let bannerUrl = barbershop.banner_url;

      // Fazer upload da logo se houver um novo arquivo
      if (logoFile) {
        const result = await uploadBarbershopLogo(logoFile, barbershop.slug);
        if (result.success) {
          logoUrl = result.url;
        } else {
          toast({
            title: "Erro ao fazer upload da logo",
            description: result.error,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Fazer upload do banner se houver um novo arquivo
      if (bannerFile) {
        const result = await uploadBarbershopBanner(bannerFile, barbershop.slug);
        if (result.success) {
          bannerUrl = result.url;
        } else {
          toast({
            title: "Erro ao fazer upload do banner",
            description: result.error,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Verificar se o slug está disponível
      if (!slugAvailable) {
        toast({
          title: "Link não disponível",
          description: "Por favor, escolha outro link para sua barbearia",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Validação: início < fim para todos os dias abertos
      for (const [dayKey, hours] of Object.entries(openingHours)) {
        if (hours && !validateHours(hours)) {
          toast({
            title: "Horários inválidos",
            description: `No dia ${dayKey}, o início deve ser menor que o fim.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Atualizar dados da barbearia
      await updateBarbershop(barbershop.id, {
        name: formData.name,
        slug: formData.slug,
        subtitle: formData.subtitle,
        instagram_url: formData.instagram_url,
        whatsapp_number: formData.whatsapp_number,
        maps_url: formData.maps_url,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        opening_hours: openingHours
      });

      // Recarregar dados
      await refetch();

      toast({
        title: "Sucesso!",
        description: "Configurações da barbearia atualizadas com sucesso"
      });

      // Limpar arquivos e previews temporários após upload bem-sucedido
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(null);
      setBannerPreview(null);

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Personalizar Barbearia"
      subtitle="Gerencie as informações do seu minisite"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Barbearia *</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Barbearia do João" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Link do Site *</Label>
              <Input 
                id="slug" 
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="exemplo-barbearia" 
                className={slugError ? "border-red-500" : slugAvailable && formData.slug ? "border-green-500" : ""}
              />
              <p className={`text-xs ${slugError ? "text-red-500" : "text-muted-foreground"}`}>
                {slugError || `Seu site ficará disponível em /barbershop/${formData.slug || 'seu-link'}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Descrição/Subtítulo</Label>
              <Textarea 
                id="subtitle" 
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Uma breve descrição da sua barbearia"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp (com DDD)</Label>
              <Input 
                id="whatsapp_number" 
                value={formData.whatsapp_number}
                onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input 
                id="instagram_url" 
                value={formData.instagram_url}
                onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                placeholder="@sua_barbearia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maps_url">Link do Google Maps</Label>
              <Input 
                id="maps_url" 
                value={formData.maps_url}
                onChange={(e) => handleInputChange('maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 w-full max-w-full overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Aparência
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize a identidade visual da sua barbearia
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-8 w-full overflow-x-hidden">
            {/* Logo Section */}
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Logo da Barbearia</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Imagem quadrada para melhor visualização
                  </p>
                </div>
              </div>
              <div className="flex justify-center w-full">
                <div className="w-full max-w-xs">
                  <ImageUpload
                    value={logoPreview || barbershop?.logo_url}
                    onChange={handleLogoChange}
                    placeholder="Adicionar logo"
                    showPreview={true}
                    maxWidth={200}
                    maxHeight={200}
                    variant="logo"
                    recommendedSize="Recomendado: 200×200px (máx. 200KB)"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Banner Section */}
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Banner da Barbearia</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Imagem panorâmica para o topo do seu site
                  </p>
                </div>
              </div>
              <div className="w-full">
                <ImageUpload
                  value={bannerPreview || barbershop?.banner_url}
                  onChange={handleBannerChange}
                  placeholder="Adicionar banner"
                  showPreview={true}
                  maxWidth={800}
                  maxHeight={300}
                  variant="banner"
                  recommendedSize="Recomendado: 1200×400px (máx. 500KB)"
                />
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Dicas para melhores resultados
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use imagens de alta qualidade e bem iluminadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>A logo deve ter fundo transparente (PNG) para melhor resultado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>O banner deve representar o ambiente da sua barbearia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Evite textos muito pequenos nas imagens</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Horários de Funcionamento - Otimizado Mobile */}
        <Card className="border-2 md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Horários de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Agrupamento Visual Semanal - Otimizado Mobile */}
            <div className="mb-4 sm:mb-6 space-y-3">
              <Label className="font-medium text-sm">Aplicar mesmo horário para:</Label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[{day:1,label:"Seg"},{day:2,label:"Ter"},{day:3,label:"Qua"},{day:4,label:"Qui"},{day:5,label:"Sex"}].map(({day,label}) => (
                  <label key={day} className="flex items-center gap-1.5 text-xs sm:text-sm bg-muted/50 px-2 py-1.5 rounded-md">
                    <Checkbox
                      checked={selectedWeekdays.includes(day)}
                      onCheckedChange={() => toggleWeekdaySelection(day)}
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Das</Label>
                  <Input 
                    type="time" 
                    value={groupStart} 
                    onChange={e=>setGroupStart(e.target.value)} 
                    step={900} 
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input 
                    type="time" 
                    value={groupEnd} 
                    onChange={e=>setGroupEnd(e.target.value)} 
                    step={900} 
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={applyGroupToSelected}
                  className="h-9 text-xs sm:text-sm"
                  size="sm"
                >
                  Aplicar para selecionados
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearAllHours}
                  className="h-9 text-xs sm:text-sm"
                  size="sm"
                >
                  Limpar Tudo
                </Button>
              </div>
              {validationError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">{validationError}</p>
              )}
            </div>

            {/* Cards dos Dias - Otimizado Mobile */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { day: 0, name: 'Domingo' },
                { day: 1, name: 'Segunda-feira' },
                { day: 2, name: 'Terça-feira' },
                { day: 3, name: 'Quarta-feira' },
                { day: 4, name: 'Quinta-feira' },
                { day: 5, name: 'Sexta-feira' },
                { day: 6, name: 'Sábado' }
              ].map(({ day, name }) => {
                const daySchedule = openingHours[day.toString()];
                const isClosed = daySchedule === null;
                
                return (
                  <div 
                    key={day} 
                    className={cn(
                      "space-y-2 p-3 border rounded-lg transition-all",
                      isClosed ? "bg-muted/30" : "bg-background"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-medium text-sm truncate">{name}</Label>
                      <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-xs text-muted-foreground">{isClosed ? "Fechado" : "Aberto"}</Label>
                        <Switch 
                          checked={!isClosed} 
                          onCheckedChange={(checked)=>setDayOpen(day, Boolean(checked))}
                          className="scale-90 sm:scale-100"
                        />
                      </div>
                    </div>
                    
                    {!isClosed && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Abertura</Label>
                          <Input
                            type="time"
                            value={daySchedule?.start || ''}
                            onChange={(e) => handleOpeningHoursChange(day, 'start', e.target.value)}
                            step={900}
                            className="h-9 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Fechamento</Label>
                          <Input
                            type="time"
                            value={daySchedule?.end || ''}
                            onChange={(e) => handleOpeningHoursChange(day, 'end', e.target.value)}
                            step={900}
                            className="h-9 text-sm mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              💡 Configure os horários de funcionamento da sua barbearia. Dias marcados como "Fechado" não aparecerão no site.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end px-4 sm:px-0">
        <Button 
          onClick={handleSave}
          disabled={loading || !slugAvailable || !formData.name || !formData.slug}
          size="lg"
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {barbershop && (
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle>Visualização do Minisite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Veja como seu minisite está ficando:
            </p>
            <Button asChild variant="outline">
              <a href={`/barbershop/${barbershop.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Meu Site
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default BarbershopSettings;