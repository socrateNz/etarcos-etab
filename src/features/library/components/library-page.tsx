"use client";

import { useState } from "react";
import { BookOpen, Plus, Search, RotateCcw, Library, BookMarked, AlertTriangle, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  useBooks,
  useLibraryStats,
  useLoans,
  useDeleteBook,
  useReturnLoan,
} from "../hooks/use-library";
import type { BookWithLoans, LoanWithRelations } from "../types";
import type { CreateBookInput, UpdateBookInput, CreateLoanInput } from "../schemas";
import { useCreateBook, useUpdateBook, useCreateLoan } from "../hooks/use-library";
import { BookFormDialog } from "./book-form-dialog";
import { LoanFormDialog } from "./loan-form-dialog";

export function LibraryPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("books");
  const [bookDialog, setBookDialog] = useState<{ open: boolean; book?: BookWithLoans }>({ open: false });
  const [loanDialog, setLoanDialog] = useState<{ open: boolean; book?: BookWithLoans }>({ open: false });
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [returnLoanId, setReturnLoanId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data: booksData, isLoading: booksLoading, error: booksError } = useBooks({ search: search || undefined });
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: activeLoans } = useLoans(true);

  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const createLoan = useCreateLoan();
  const returnLoan = useReturnLoan();

  const books = booksData?.data ?? [];

  const handleSaveBook = async (values: CreateBookInput | UpdateBookInput) => {
    if ("id" in values && values.id) {
      const result = await updateBook.mutateAsync(values as UpdateBookInput);
      if (!result.error) setBookDialog({ open: false });
    } else {
      const result = await createBook.mutateAsync(values as CreateBookInput);
      if (!result.error) setBookDialog({ open: false });
    }
  };

  const handleCreateLoan = async (values: CreateLoanInput) => {
    const result = await createLoan.mutateAsync(values);
    if (!result.error) setLoanDialog({ open: false });
  };

  const handleDeleteBook = async () => {
    if (!deleteBookId) return;
    await deleteBook.mutateAsync(deleteBookId);
    setDeleteBookId(null);
  };

  const handleReturnLoan = async () => {
    if (!returnLoanId) return;
    await returnLoan.mutateAsync({
      loan_id: returnLoanId,
      return_date: new Date().toISOString().split("T")[0],
    });
    setReturnLoanId(null);
  };

  const isOverdue = (loan: LoanWithRelations) =>
    !loan.return_date && new Date(loan.due_date) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque"
        description="Gestion du catalogue de livres et des prêts"
        icon={BookOpen}
        actions={
          <Button onClick={() => setBookDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un livre
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Titres au catalogue", value: stats?.total_books, icon: Library, color: "text-brand-500" },
          { label: "Exemplaires disponibles", value: stats?.available_copies, icon: BookOpen, color: "text-emerald-500" },
          { label: "Prêts en cours", value: stats?.active_loans, icon: BookMarked, color: "text-amber-500" },
          { label: "En retard", value: stats?.overdue_loans, icon: AlertTriangle, color: "text-rose-500" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{card.value ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="books">Catalogue</TabsTrigger>
          <TabsTrigger value="loans">
            Prêts en cours
            {(stats?.active_loans ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{stats?.active_loans}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* ===== CATALOGUE ===== */}
        <TabsContent value="books" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, auteur, ISBN..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {booksError ? (
            <ErrorState message="Impossible de charger le catalogue." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead className="text-center">Exemplaires</TableHead>
                    <TableHead className="text-center">Disponibles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booksLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : books.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Library className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        {search ? "Aucun livre trouvé pour cette recherche." : "Le catalogue est vide. Ajoutez un premier livre."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>
                          {book.category ? (
                            <Badge variant="outline">{book.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{book.isbn ?? "—"}</TableCell>
                        <TableCell className="text-center">{book.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={book.available_qty > 0 ? "default" : "destructive"}
                            className={book.available_qty > 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : ""}
                          >
                            {book.available_qty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={book.available_qty === 0}
                              onClick={() => setLoanDialog({ open: true, book })}
                            >
                              <BookMarked className="h-3 w-3 mr-1" />
                              Prêter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => setBookDialog({ open: true, book })}
                            >
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteBookId(book.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ===== PRETS EN COURS ===== */}
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livre</TableHead>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Date de prêt</TableHead>
                  <TableHead>Retour prévu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loansLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (activeLoans ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      Aucun prêt en cours.
                    </TableCell>
                  </TableRow>
                ) : (
                  (activeLoans ?? []).map((loan) => (
                    <TableRow key={loan.id} className={isOverdue(loan) ? "bg-rose-500/5" : ""}>
                      <TableCell className="font-medium">{(loan.book as any)?.title ?? "—"}</TableCell>
                      <TableCell>{(loan.borrower as any)?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(loan.loan_date)}</TableCell>
                      <TableCell className="text-sm">{formatDate(loan.due_date)}</TableCell>
                      <TableCell>
                        {isOverdue(loan) ? (
                          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            En retard
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            En cours
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setReturnLoanId(loan.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retour
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ===== HISTORIQUE ===== */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livre</TableHead>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Date de prêt</TableHead>
                  <TableHead>Date de retour</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loansLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (loans ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Aucun historique de prêt.
                    </TableCell>
                  </TableRow>
                ) : (
                  (loans ?? []).map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">{(loan.book as any)?.title ?? "—"}</TableCell>
                      <TableCell>{(loan.borrower as any)?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(loan.loan_date)}</TableCell>
                      <TableCell className="text-sm">
                        {loan.return_date ? formatDate(loan.return_date) : (
                          <span className="text-muted-foreground">En cours</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loan.return_date ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Rendu</Badge>
                        ) : isOverdue(loan) ? (
                          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20">En retard</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">En cours</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BookFormDialog
        open={bookDialog.open}
        book={bookDialog.book}
        onClose={() => setBookDialog({ open: false })}
        onSubmit={handleSaveBook}
        isLoading={createBook.isPending || updateBook.isPending}
      />

      <LoanFormDialog
        open={loanDialog.open}
        book={loanDialog.book}
        onClose={() => setLoanDialog({ open: false })}
        onSubmit={handleCreateLoan}
        isLoading={createLoan.isPending}
      />

      <ConfirmDialog
        open={!!deleteBookId}
        onOpenChange={(open) => !open && setDeleteBookId(null)}
        title="Supprimer ce livre ?"
        description="Cette action est irréversible. Le livre sera retiré du catalogue."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteBook}
        isLoading={deleteBook.isPending}
      />

      <ConfirmDialog
        open={!!returnLoanId}
        onOpenChange={(open) => !open && setReturnLoanId(null)}
        title="Confirmer le retour ?"
        description="Marquer ce livre comme rendu aujourd'hui. La disponibilité sera mise à jour automatiquement."
        confirmLabel="Confirmer le retour"
        onConfirm={handleReturnLoan}
        isLoading={returnLoan.isPending}
      />
    </div>
  );
}
