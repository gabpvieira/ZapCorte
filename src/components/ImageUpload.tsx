import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Camera, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateImageFile, getPlaceholderImageUrl } from '@/lib/storage';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  onUrlChange?: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showPreview?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  variant?: 'logo' | 'banner';
  recommendedSize?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUrlChange,
  disabled = false,
  className,
  placeholder = "Clique para fazer upload",
  showPreview = true,
  maxWidth = 400,
  maxHeight = 300,
  variant = 'banner',
  recommendedSize
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileSelect = (file: File) => {
    setError(null);
    setIsUploading(true);

    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Arquivo inválido');
      setIsUploading(false);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      if (onUrlChange) {
        onUrlChange(result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('Erro ao carregar imagem');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Chamar callback
    onChange(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (onUrlChange) {
      onUrlChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const aspectRatio = variant === 'logo' ? '1/1' : '16/9';
  const Icon = variant === 'logo' ? Camera : Cloud;

  return (
    <div className={cn("w-full max-w-full overflow-hidden", className)}>
      {/* Preview com Aspect Ratio */}
      {preview && showPreview ? (
        <div className="space-y-3 w-full">
          <div 
            className={cn(
              "relative w-full overflow-hidden group",
              variant === 'logo' ? "rounded-2xl" : "rounded-xl"
            )}
            style={{ aspectRatio }}
          >
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            <img
              src={preview}
              alt="Preview"
              className={cn(
                "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                variant === 'logo' ? "rounded-2xl" : "rounded-xl"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  disabled={disabled || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
          {recommendedSize && (
            <p className="text-xs text-center text-muted-foreground">
              {recommendedSize}
            </p>
          )}
        </div>
      ) : (
        /* Upload Dropzone */
        <div className="space-y-3 w-full">
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative w-full overflow-hidden border-2 border-dashed transition-all cursor-pointer",
              "hover:border-primary hover:bg-primary/5 hover:shadow-lg",
              "flex flex-col items-center justify-center",
              isDragging && "border-primary bg-primary/10 scale-[1.02]",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-destructive bg-destructive/5",
              variant === 'logo' ? "rounded-2xl" : "rounded-xl"
            )}
            style={{ aspectRatio, minHeight: variant === 'logo' ? '200px' : '150px' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={disabled || isUploading}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center p-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-primary">Carregando imagem...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className={cn(
                  "mb-4 p-4 rounded-full transition-colors",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragging ? "Solte a imagem aqui" : placeholder}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  ou arraste e solte
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP (máx. 2MB)
                </p>
              </div>
            )}
          </div>
          {recommendedSize && (
            <p className="text-xs text-center text-muted-foreground">
              {recommendedSize}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
          <X className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}