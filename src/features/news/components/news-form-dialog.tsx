"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { createNewsPostSchema, type CreateNewsPostInput, type UpdateNewsPostInput } from "../schemas";
import type { NewsPostWithAuthor } from "../types";

interface NewsFormDialogProps {
  open: boolean;
  post?: NewsPostWithAuthor;
  onClose: () => void;
  onSubmit: (values: CreateNewsPostInput | UpdateNewsPostInput) => Promise<void>;
  isLoading?: boolean;
}

type FormValues = CreateNewsPostInput;

export function NewsFormDialog({ open, post, onClose, onSubmit, isLoading = false }: NewsFormDialogProps) {
  const isEdit = !!post;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(createNewsPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      is_published: true,
      tags: [] as string[],
    },
  });

  const isPublished = watch("is_published");

  useEffect(() => {
    if (open) {
      reset(post
        ? { title: post.title, content: post.content, excerpt: post.excerpt ?? "", is_published: post.is_published, tags: post.tags ?? [] }
        : { title: "", content: "", excerpt: "", is_published: true, tags: [] }
      );
    }
  }, [open, post, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    if (isEdit && post) {
      await onSubmit({ ...values, id: post.id });
    } else {
      await onSubmit(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'annonce" : "Publier une nouvelle annonce"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez le contenu de l'annonce officielle." : "Communiquez des informations aux parents, élèves et enseignants."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Titre de l'annonce <span className="text-destructive">*</span></Label>
            <Input {...register("title")} placeholder="Ex: Réunion de rentrée des classes, Calendrier des examens..." />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Résumé rapide</Label>
            <Input {...register("excerpt")} placeholder="Bref aperçu affiché sur les cartes d'actualités..." />
          </div>

          <div className="space-y-1.5">
            <Label>Contenu détaillé <span className="text-destructive">*</span></Label>
            <Textarea {...register("content")} placeholder="Rédigez le texte complet de l'annonce..." rows={6} />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Publier immédiatement</p>
              <p className="text-xs text-muted-foreground">Si désactivé, l'annonce sera enregistrée en brouillon.</p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={(checked) => setValue("is_published", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Publier l'annonce"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
