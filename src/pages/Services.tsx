import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Clock, DollarSign, Scissors, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useUserData } from "@/hooks/useUserData";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ImageUpload } from "@/components/ImageUpload";
import { uploadServiceImage, deleteServiceImage, getPlaceholderImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image_url?: string;
  barbershop_id: string;
  created_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  image?: File;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  });
  const [canAddService, setCanAddService] = useState(true);
  const [serviceLimitMessage, setServiceLimitMessage] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();
  const { barbershop } = useUserData();

  useEffect(() => {
    if (barbershop?.id) {
      fetchServices();
    }
  }, [barbershop?.id]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershop?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);

      if (barbershop) {
        const activeServices = (data || []).filter(s => s.is_active !== false);
        const planType = barbershop.plan_type || 'freemium';
        const maxServices = planType === 'freemium' ? 4 : 999999;
        
        if (activeServices.length >= maxServices) {
          setCanAddService(false);
          setServiceLimitMessage(
            `Limite de ${maxServices} serviços atingido. Faça upgrade para adicionar mais.`
          );
        } else {
          setCanAddService(true);
          setServiceLimitMessage("");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!barbershop?.slug) return null;
    
    const result = await uploadServiceImage(file, barbershop.slug, { resize: true });
    
    if (!result.success) {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      return null;
    }
    
    return result.url || null;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_minutes: "",
    });
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barbershop?.id) {
      toast({
        title: "Erro",
        description: "Barbearia não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingService?.image_url;

      if (formData.image) {
        const uploadedUrl = await handleImageUpload(formData.image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration_minutes),
        image_url: imageUrl,
        barbershop_id: barbershop.id,
      };

      if (editingService) {
        if (imageUrl && editingService.image_url && imageUrl !== editingService.image_url) {
          await deleteServiceImage(editingService.image_url);
        }

        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Serviço atualizado!",
        });
      } else {
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Serviço criado!",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      if (error?.message?.includes('LIMIT_EXCEEDED')) {
        const errorMessage = error.message.replace('LIMIT_EXCEEDED: ', '');
        toast({
          title: "Limite Atingido",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      } else {
        console.error("Erro ao salvar serviço:", error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o serviço.",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      const serviceToDelete = services.find(service => service.id === serviceId);
      
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      if (serviceToDelete?.image_url) {
        await deleteServiceImage(serviceToDelete.image_url);
      }

      toast({
        title: "Sucesso",
        description: "Serviço excluído!",
      });

      fetchServices();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Meus Serviços" subtitle="Gerencie seu catálogo">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <div className="h-32 sm:h-40 bg-muted"></div>
              <CardContent className="p-3 sm:p-4 space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-3 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Meus Serviços"
      subtitle="Gerencie seu catálogo"
      action={
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                disabled={!canAddService}
                className="w-full sm:w-auto"
                title={!canAddService ? serviceLimitMessage : "Adicionar novo serviço"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Nome do Serviço</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Corte Masculino"
                    required
                    className="mt-1 h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o serviço..."
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="price" className="text-sm">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0,00"
                      required
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      placeholder="30"
                      required
                      className="mt-1 h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="image" className="text-sm">Imagem do Serviço</Label>
                  <ImageUpload
                    value={editingService?.image_url}
                    onChange={(file) => setFormData({ ...formData, image: file })}
                    disabled={uploading}
                    placeholder="Adicionar imagem"
                    showPreview={true}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploading} className="flex-1">
                    {uploading ? "Salvando..." : editingService ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {!canAddService && (
            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800 w-full sm:max-w-xs text-center sm:text-right">
              {serviceLimitMessage}
            </div>
          )}
        </div>
      }
    >
      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4"
        >
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Scissors className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Nenhum serviço cadastrado
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Comece criando seu primeiro serviço para que os clientes possam agendar.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Serviço
              </Button>
            </DialogTrigger>
          </Dialog>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  {/* Imagem */}
                  <div className="relative h-32 sm:h-40 overflow-hidden bg-muted">
                    <img
                      src={service.image_url || getPlaceholderImageUrl(400, 300)}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getPlaceholderImageUrl(400, 300);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Conteúdo */}
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-1">
                      {service.name}
                    </h3>
                    
                    {service.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Info */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        R$ {service.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {service.duration}min
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                        className="flex-1 h-9 text-xs sm:text-sm"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{service.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto m-0">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(service.id)}
                              className="w-full sm:w-auto m-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Services;
