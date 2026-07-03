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

// Create admin client to bypass RLS and manage authentication records
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = "etarcos3@gmail.com";
const password = "Admin@123";

async function createSuperAdmin() {
  console.log(`🚀 Tentative de création du Super Admin '${email}'...`);
  
  try {
    // 1. Create auth user in Supabase Authentication
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    let userId;
    if (authError) {
      console.log("ℹ️ L'utilisateur existe probablement déjà. Récupération de l'ID...");
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find(u => u.email === email);
      if (!existing) throw authError;
      userId = existing.id;
      console.log(`✅ Compte existant trouvé (ID: ${userId})`);
    } else {
      userId = authUser.user.id;
      console.log(`✅ Compte d'authentification Supabase créé (ID: ${userId})`);
    }

    // 2. Ensure 'super_admin' role exists in roles table
    let { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('slug', 'super_admin')
      .single();

    if (roleError || !roleData) {
      console.log("ℹ️ Rôle 'super_admin' absent. Création du rôle...");
      const { data: newRole, error: insertRoleError } = await supabase
        .from('roles')
        .insert({
          name: 'Super Administrateur',
          slug: 'super_admin',
          description: 'Accès complet à la plateforme SaaS'
        })
        .select()
        .single();
        
      if (insertRoleError) throw insertRoleError;
      roleData = newRole;
      console.log("✅ Rôle 'super_admin' inséré.");
    }

    const roleId = roleData.id;

    // 3. Ensure system establishment exists
    const systemEstId = "00000000-0000-0000-0000-000000000000";
    const { data: estData, error: estError } = await supabase
      .from('establishments')
      .select('id')
      .eq('id', systemEstId)
      .single();

    if (estError || !estData) {
      console.log("ℹ️ Établissement système absent. Création du tenant...");
      const { error: insertEstError } = await supabase
        .from('establishments')
        .insert({
          id: systemEstId,
          name: "Etarcos Platform",
          slug: "etarcos-platform"
        });
      if (insertEstError) throw insertEstError;
      console.log("✅ Établissement système créé.");
    }

    // 4. Ensure user profile exists in public.users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.log("ℹ️ Profil dans la table 'users' absent. Insertion...");
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name: "Etarcos Super Admin",
          establishment_id: systemEstId,
          is_active: true
        });
      if (insertUserError) throw insertUserError;
      console.log("✅ Profil utilisateur inséré.");
    }

    // 5. Link user to role in public.user_roles
    const { data: userRoleLink, error: userRoleLinkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .eq('establishment_id', systemEstId)
      .single();

    if (userRoleLinkError || !userRoleLink) {
      console.log("ℹ️ Attribution du rôle 'super_admin' dans 'user_roles'...");
      const { error: insertUserRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          establishment_id: systemEstId
        });
      if (insertUserRoleError) throw insertUserRoleError;
      console.log("✅ Rôle 'super_admin' attribué.");
    }

    console.log(`\n🎉 Super Administrateur configuré avec succès !`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);

  } catch (err) {
    console.error("❌ Échec de la configuration :", err.message);
  }
}

createSuperAdmin();
