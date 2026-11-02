"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

// Shared upload logic behind every photo widget (single AvatarUpload form field,
// or a dense per-student tile) — keeps validation/upload behavior identical everywhere.
export function useAvatarUpload(onChange: (url: string | null) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Fichier trop volumineux", {
        description: "L'image ne doit pas dépasser 2 Mo.",
      });
      return;
    }

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
            body: JSON.stringify({ file: base64String, kind: "image" }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            onChange(json.url);
            toast.success("Photo mise à jour");
          } else {
            toast.error(json.error || "Erreur de téléversement");
          }
        } catch {
          toast.error("Erreur de connexion lors de l'envoi");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return { fileInputRef, isUploading, handleUploadClick, handleFileChange, handleRemove };
}
