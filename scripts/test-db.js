const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.error("Impossible de lire .env.local:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables de service rôle Supabase manquantes dans .env.local !");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectUser() {
  console.log("🔍 Inspection de l'utilisateur etarcos3@gmail.com...");
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, user_roles(role:roles(*))")
      .eq("email", "etarcos3@gmail.com")
      .single();

    if (userError) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", userError.message);
      return;
    }

    console.log("\n👤 Profil utilisateur :");
    console.log(JSON.stringify(user, null, 2));

    const role = user.user_roles?.[0]?.role?.slug;
    console.log(`\n🔑 Rôle résolu pour NextAuth : '${role}'`);
  } catch (err) {
    console.error("❌ Erreur inattendue:", err.message);
  }
}

inspectUser();
