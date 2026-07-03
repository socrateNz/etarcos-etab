"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  name: string;
  className?: string;
  disabled?: boolean;
}

export function AvatarUpload({
  value,
  onChange,
  name,
  className,
  disabled = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Fichier trop volumineux", {
        description: "L'image ne doit pas dépasser 2 Mo.",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Type de fichier non supporté", {
        description: "Veuillez sélectionner un fichier image.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64String }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            onChange(json.url);
            toast.success("Image mise à jour");
          } else {
            toast.error(json.error || "Erreur de téléversement");
          }
        } catch {
          toast.error("Erreur de connexion lors de l'envoi");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors du traitement de l'image");
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative group">
        <Avatar className="w-20 h-20 border border-border">
          <AvatarImage src={value || undefined} alt={name} />
          <AvatarFallback className="bg-brand-gradient text-white text-lg font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {!disabled && !isUploading && (
          <button
            type="button"
            onClick={handleUploadClick}
            className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Camera className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
          >
            Sélectionner une photo
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          JPG, PNG ou GIF. Max 2 Mo.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
