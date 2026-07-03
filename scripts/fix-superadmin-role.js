const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
try {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && value) process.env[key] = value;
    }
  });
} catch (e) {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userId = '943dfe1d-f9db-4c72-bb74-dd1eeaf35fa1';
const systemEstId = '00000000-0000-0000-0000-000000000000';

async function diagnoseAndFix() {
  console.log('🔍 === DIAGNOSTIC COMPLET ===\n');

  // 1. Check user in auth
  console.log('1. Vérification compte Auth Supabase...');
  const { data: authList } = await supabase.auth.admin.listUsers();
  const authUser = authList?.users?.find(u => u.id === userId);
  console.log('   Auth user:', authUser ? `✅ ${authUser.email}` : '❌ ABSENT');

  // 2. Check users table
  console.log('\n2. Vérification table users...');
  const { data: userRow, error: userErr } = await supabase
    .from('users').select('*').eq('id', userId).maybeSingle();
  console.log('   users row:', userRow ? `✅ ${JSON.stringify(userRow)}` : `❌ ABSENT (err: ${userErr?.message})`);

  // 3. Check roles table
  console.log('\n3. Vérification table roles...');
  const { data: roles, error: rolesErr } = await supabase.from('roles').select('*');
  console.log('   roles:', roles ? JSON.stringify(roles) : `❌ ${rolesErr?.message}`);

  // 4. Check establishments table
  console.log('\n4. Vérification établissement système...');
  const { data: est, error: estErr } = await supabase
    .from('establishments').select('*').eq('id', systemEstId).maybeSingle();
  console.log('   establishments:', est ? `✅ ${est.name}` : `❌ ABSENT (err: ${estErr?.message})`);

  // 5. Check user_roles table (ALL rows)
  console.log('\n5. Vérification table user_roles (TOUTES les lignes)...');
  const { data: allUserRoles, error: allUserRolesErr } = await supabase.from('user_roles').select('*');
  console.log('   ALL user_roles:', allUserRoles ? JSON.stringify(allUserRoles) : `❌ ${allUserRolesErr?.message}`);

  // 6. Check user_roles for THIS user
  console.log('\n6. Vérification user_roles pour userId...');
  const { data: myRoles, error: myRolesErr } = await supabase
    .from('user_roles').select('*').eq('user_id', userId);
  console.log('   user_roles[userId]:', myRoles ? JSON.stringify(myRoles) : `❌ ${myRolesErr?.message}`);

  // 7. If user_roles is empty → FIX IT
  if (!myRoles || myRoles.length === 0) {
    console.log('\n⚠️  Aucune ligne user_roles pour cet utilisateur. Tentative de correction...');

    const roleRow = roles?.find(r => r.slug === 'super_admin');
    if (!roleRow) {
      console.error('❌ Rôle super_admin introuvable dans la table roles!');
      return;
    }

    // Make sure establishment exists
    if (!est) {
      console.log('   → Création établissement système...');
      const { error: insertEstErr } = await supabase.from('establishments').insert({
        id: systemEstId,
        name: 'Etarcos Platform',
        slug: 'etarcos-platform'
      });
      if (insertEstErr) {
        console.error('   ❌ Erreur création établissement:', insertEstErr.message);
        return;
      }
      console.log('   ✅ Établissement créé.');
    }

    // Insert user_roles row
    const { error: insertErr } = await supabase.from('user_roles').insert({
      user_id: userId,
      role_id: roleRow.id,
      establishment_id: systemEstId
    });

    if (insertErr) {
      console.error('   ❌ Erreur insertion user_roles:', insertErr.message);
      console.error('      Details:', JSON.stringify(insertErr));
    } else {
      console.log('   ✅ Lien user_roles créé avec succès!');
      console.log(`      user_id=${userId}, role_id=${roleRow.id}, establishment_id=${systemEstId}`);
    }
  } else {
    console.log('\n✅ user_roles est déjà correctement configuré!');
  }

  console.log('\n=== DIAGNOSTIC TERMINÉ ===');
}

diagnoseAndFix();
