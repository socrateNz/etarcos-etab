import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/profile/profile-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mon Profil | Etarcos Etab",
  description: "Gérez vos informations personnelles et paramètres de compte",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch full user profile from Supabase
  const supabase = await createAdminClient();
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  return (
    <ProfileClient
      session={session}
      userProfile={userProfile}
    />
  );
}
