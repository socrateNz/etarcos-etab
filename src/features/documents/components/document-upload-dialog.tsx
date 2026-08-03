"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDocumentSchema, type CreateDocumentInput } from "../schemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo — aligné sur experimental.serverActions.bodySizeLimit

const CATEGORY_LABELS: Record<string, string> = {
  report_card: "Bulletin scolaire",
  receipt: "Reçu / Facture",
  contract: "Contrat",
  id_card: "Pièce d'identité",
  other: "Autre",
};

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateDocumentInput) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentUploadDialog({ open, onClose, onSubmit, isLoading = false }: DocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      file_url: "",
      file_type: "",
      file_size: 0,
      category: "other" as const,
      is_public: false,
    },
  });

  const category = watch("category");
  const fileUrl = watch("file_url");

  const handleClose = () => {
    reset();
    setFileName(null);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fichier trop volumineux", { description: "Le document ne doit pas dépasser 10 Mo." });
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64 }),
      });
      const json = await res.json();

      if (json.success && json.url) {
        setValue("file_url", json.url);
        setValue("file_type", file.type || "");
        setValue("file_size", file.size);
        setFileName(file.name);
        if (!watch("title")) setValue("title", file.name.replace(/\.[^/.]+$/, ""));
      } else {
        toast.error(json.error || "Erreur de téléversement");
      }
    } catch {
      toast.error("Erreur lors du téléversement du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setValue("file_url", "");
    setValue("file_type", "");
    setValue("file_size", 0);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (values: CreateDocumentInput) => {
    await onSubmit(values);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Téléverser un document</DialogTitle>
          <DialogDescription>
            Ajoutez un document officiel au registre de l&apos;établissement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Fichier <span className="text-destructive">*</span></Label>
            {fileName ? (
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30">
                <span className="flex items-center gap-2 text-sm truncate">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{fileName}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Téléversement..." : "Sélectionner un fichier (max 10 Mo)"}
              </Button>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" disabled={isUploading} />
            {errors.file_url && <p className="text-xs text-destructive">{errors.file_url.message}</p>}
            {!fileUrl && !errors.file_url && (
              <input type="hidden" {...register("file_url")} />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Titre <span className="text-destructive">*</span></Label>
            <Input {...register("title")} placeholder="Ex: Certificat de scolarité - Jean Dupont" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={(v) => v && setValue("category", v as CreateDocumentInput["category"])}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Notes complémentaires (optionnel)..." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || isUploading || !fileUrl}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
