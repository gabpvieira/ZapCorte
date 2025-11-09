import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  variant?: 'logo' | 'banner'; // Adicionado
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
  variant = 'banner' // Padrão para banner
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Arquivo inválido');
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive bg-destructive/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {preview && showPreview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className={cn(
                "object-cover w-full h-full",
                variant === 'logo' ? "rounded-full" : "rounded-lg"
              )}
              style={{ maxWidth, maxHeight }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                disabled={disabled}
              >
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
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {placeholder}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP ou SVG (máx. 2MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* File Info */}
      {preview && !showPreview && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Imagem selecionada</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}