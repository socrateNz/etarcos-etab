import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Etarcos Etab – Gestion d'établissements scolaires",
    template: "%s | Etarcos Etab",
  },
  description:
    "Plateforme SaaS complète de gestion des établissements d'enseignement. Gérez élèves, personnel, finances, bulletins et bien plus.",
  keywords: ["école", "gestion", "ERP", "SaaS", "élèves", "bulletins", "paiements"],
  authors: [{ name: "Etarcos" }],
  creator: "Etarcos",
  openGraph: {
    title: "Etarcos Etab",
    description: "Plateforme SaaS de gestion des établissements scolaires",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
