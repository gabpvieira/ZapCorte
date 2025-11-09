import { supabase } from './supabase';

// Configurações de upload
const UPLOAD_CONFIG = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  bucket: 'uploads',
  serviceFolder: 'services'
};

// Função para validar arquivo
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Verificar tipo de arquivo
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou SVG.'
    };
  }

  // Verificar tamanho do arquivo
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 2MB.'
    };
  }

  return { isValid: true };
}

// Função para redimensionar imagem (opcional)
export function resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height);

      // Converter para blob e depois para file
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        } else {
          resolve(file);
        }
      }, file.type, 0.9);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Função principal para upload de imagem de serviço
export async function uploadServiceImage(
  file: File, 
  barbershopSlug: string,
  options: { resize?: boolean } = {}
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Redimensionar se solicitado
    let fileToUpload = file;
    if (options.resize && file.type !== 'image/svg+xml') {
      fileToUpload = await resizeImage(file);
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${UPLOAD_CONFIG.serviceFolder}/${barbershopSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Fazer upload
    const { error: uploadError } = await supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return { success: false, error: 'Erro ao fazer upload da imagem.' };
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };

  } catch (error) {
    console.error('Erro no upload:', error);
    return { success: false, error: 'Erro inesperado ao fazer upload.' };
  }
}

// Função para deletar imagem
export async function deleteServiceImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === UPLOAD_CONFIG.bucket);
    
    if (bucketIndex === -1) {
      return { success: false, error: 'URL inválida.' };
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Deletar arquivo
    const { error } = await supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return { success: false, error: 'Erro ao deletar imagem.' };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return { success: false, error: 'Erro inesperado ao deletar imagem.' };
  }
}

// Função para upload de logo da barbearia
export async function uploadBarbershopLogo(
  file: File, 
  barbershopSlug: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `barbershops/${barbershopSlug}/logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Fazer upload
    const { error: uploadError } = await supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload da logo:', uploadError);
      return { success: false, error: 'Erro ao fazer upload da logo.' };
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };

  } catch (error) {
    console.error('Erro no upload da logo:', error);
    return { success: false, error: 'Erro inesperado ao fazer upload da logo.' };
  }
}

// Função para upload de banner da barbearia
export async function uploadBarbershopBanner(
  file: File, 
  barbershopSlug: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `barbershops/${barbershopSlug}/banner-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Fazer upload
    const { error: uploadError } = await supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload do banner:', uploadError);
      return { success: false, error: 'Erro ao fazer upload do banner.' };
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from(UPLOAD_CONFIG.bucket)
      .getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };

  } catch (error) {
    console.error('Erro no upload do banner:', error);
    return { success: false, error: 'Erro inesperado ao fazer upload do banner.' };
  }
}

// Função para obter URL de placeholder
export function getPlaceholderImageUrl(width: number = 400, height: number = 300): string {
  return `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=80`;
}