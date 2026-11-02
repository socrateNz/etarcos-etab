import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-1">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          La page demandée n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
