import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Nouveau mot de passe | Etarcos Etab" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";

  if (!value) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lien invalide</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ce lien de réinitialisation est incomplet. Ouvrez le lien reçu par email, ou faites une nouvelle demande.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:underline">
          Nouvelle demande
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={value} />;
}
