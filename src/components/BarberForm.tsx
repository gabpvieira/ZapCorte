import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Barber } from '@/lib/supabase';

interface BarberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber?: Barber | null;
  onSave: (data: Partial<Barber>) => Promise<void>;
}

const SPECIALTY_OPTIONS = [
  'Corte Masculino',
  'Corte Feminino',
  'Corte Infantil',
  'Barba',
  'Degradê',
  'Sobrancelha',
  'Pigmentação',
  'Luzes',
  'Platinado',
  'Relaxamento'
];

export function BarberForm({ open, onOpenChange, barber, onSave }: BarberFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [] as string[],
    photo_url: ''
  });

  // Atualizar formData quando barber mudar
  useEffect(() => {
    if (barber) {
      setFormData({
        name: barber.name || '',
        email: barber.email || '',
        phone: barber.phone || '',
        bio: barber.bio || '',
        specialties: barber.specialties || [],
        photo_url: barber.photo_url || ''
      });
      setPhotoPreview(barber.photo_url || null);
    } else {
      // Resetar formulário para novo barbeiro
      setFormData({
        name: '',
        email: '',
        phone: '',
        bio: '',
        specialties: [],
        photo_url: ''
      });
      setPhotoPreview(null);
    }
  }, [barber, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A foto deve ter no máximo 2MB.',
          variant: 'destructive',
        });
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do barbeiro.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.name.trim().length < 2) {
      toast({
        title: 'Nome muito curto',
        description: 'O nome deve ter pelo menos 2 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      
      toast({
        title: barber ? 'Barbeiro atualizado!' : 'Barbeiro adicionado!',
        description: `${formData.name} foi ${barber ? 'atualizado' : 'adicionado'} com sucesso.`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o barbeiro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {barber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto */}
          <div className="space-y-2">
            <Label>Foto do Barbeiro</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 200x200px, máx. 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="joao@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Conte um pouco sobre a experiência e estilo do barbeiro..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 caracteres
            </p>
          </div>

          {/* Especialidades */}
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((specialty) => (
                <Badge
                  key={specialty}
                  variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSpecialty(specialty)}
                >
                  {specialty}
                  {formData.specialties.includes(specialty) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Clique para selecionar/remover especialidades
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {barber ? 'Salvar Alterações' : 'Adicionar Barbeiro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
