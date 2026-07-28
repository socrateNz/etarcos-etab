"use client";

import { useState } from "react";
import { Newspaper, Plus, Search, Calendar, User, Eye, Trash2, Edit3, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  useNewsPosts,
  useCreateNewsPost,
  useUpdateNewsPost,
  useDeleteNewsPost,
} from "../hooks/use-news";
import { NewsFormDialog } from "./news-form-dialog";
import type { NewsPostWithAuthor } from "../types";
import type { CreateNewsPostInput, UpdateNewsPostInput } from "../schemas";

export function NewsPage() {
  const [search, setSearch] = useState("");
  const [postDialog, setPostDialog] = useState<{ open: boolean; post?: NewsPostWithAuthor }>({ open: false });
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<NewsPostWithAuthor | null>(null);

  const { data: postsData, isLoading: postsLoading, error: postsError } = useNewsPosts({ search: search || undefined });

  const createPost = useCreateNewsPost();
  const updatePost = useUpdateNewsPost();
  const deletePost = useDeleteNewsPost();

  const posts = postsData?.data ?? [];

  const handleSavePost = async (values: CreateNewsPostInput | UpdateNewsPostInput) => {
    if ("id" in values && values.id) {
      const result = await updatePost.mutateAsync(values as UpdateNewsPostInput);
      if (!result.error) setPostDialog({ open: false });
    } else {
      const result = await createPost.mutateAsync(values as CreateNewsPostInput);
      if (!result.error) setPostDialog({ open: false });
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    await deletePost.mutateAsync(deletePostId);
    setDeletePostId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actualités & Communication"
        description="Tableau d'affichage virtuel et annonces officielles de l'établissement"
        icon={Newspaper}
        actions={
          <Button onClick={() => setPostDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle annonce
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une annonce..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {postsError ? (
        <ErrorState message="Impossible de charger le fil d'actualités." />
      ) : postsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col justify-between">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-16">
          <Newspaper className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-lg">Aucune annonce disponible</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {search ? "Aucun résultat pour cette recherche." : "Publiez votre première annonce pour informer la communauté scolaire."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  {post.is_published ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Publié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Brouillon
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2">{post.title}</CardTitle>
              </CardHeader>

              <CardContent className="py-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content}
                </p>
              </CardContent>

              <CardFooter className="pt-4 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {(post.author as any)?.name ?? "Administration"}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setPostDialog({ open: true, post })}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeletePostId(post.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <NewsFormDialog
        open={postDialog.open}
        post={postDialog.post}
        onClose={() => setPostDialog({ open: false })}
        onSubmit={handleSavePost}
        isLoading={createPost.isPending || updatePost.isPending}
      />

      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Supprimer cette annonce ?"
        description="Cette annonce sera définitivement retirée du fil d'actualités."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeletePost}
        isLoading={deletePost.isPending}
      />
    </div>
  );
}
