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

// Constants
const EST_ID = "00000000-0000-0000-0000-000000000000";
const ACADEMIC_YEAR_ID = "20262026-2026-2026-2026-202620262026";
const CLASS_3A = "33333333-3333-3333-3333-333333333333";
const CLASS_5B = "55555555-5555-5555-5555-555555555555";
const CLASS_TC = "77777777-7777-7777-7777-777777777777";
const FEE_TUITION = "11111111-1111-1111-1111-111111111111";
const FEE_ENROLL = "22222222-2222-2222-2222-222222222222";

async function seed() {
  console.log("⏳ Initialisation du peuplement de la base de données...");

  try {
    // 1. Ensure system establishment exists
    await supabase.from("establishments").upsert({
      id: EST_ID,
      name: "Etarcos Platform",
      slug: "etarcos-platform"
    });
    console.log("✅ Établissement système vérifié.");

    // 2. Insert Academic Year
    await supabase.from("academic_years").upsert({
      id: ACADEMIC_YEAR_ID,
      establishment_id: EST_ID,
      name: "2025/2026",
      start_date: "2025-09-01",
      end_date: "2026-06-30",
      is_current: true
    });
    console.log("✅ Année académique 2025/2026 insérée.");

    // 3. Insert Classrooms
    await supabase.from("classrooms").upsert([
      { id: CLASS_3A, establishment_id: EST_ID, name: "3ème A", capacity: 40 },
      { id: CLASS_5B, establishment_id: EST_ID, name: "5ème B", capacity: 40 },
      { id: CLASS_TC, establishment_id: EST_ID, name: "Terminale C", capacity: 35 }
    ]);
    console.log("✅ Classes d'école insérées.");

    // 4. Insert Fee Categories
    await supabase.from("fee_categories").upsert([
      { id: FEE_TUITION, establishment_id: EST_ID, name: "Scolarité Trimestre 1", amount: 150000, academic_year_id: ACADEMIC_YEAR_ID },
      { id: FEE_ENROLL, establishment_id: EST_ID, name: "Inscription de base", amount: 120000, academic_year_id: ACADEMIC_YEAR_ID }
    ]);
    console.log("✅ Catégories de frais scolaires insérées.");

    // 5. Create Students profiles in users table
    const studentsData = [
      { id: "10000000-0000-0000-0000-000000000001", name: "Kamdem Sarah", email: "sarah.kamdem@etarcos.com" },
      { id: "20000000-0000-0000-0000-000000000002", name: "Ngono Paul", email: "paul.ngono@etarcos.com" },
      { id: "30000000-0000-0000-0000-000000000003", name: "Tchamba Alain", email: "alain.tchamba@etarcos.com" }
    ];

    for (const s of studentsData) {
      await supabase.from("users").upsert({
        id: s.id,
        name: s.name,
        email: s.email,
        establishment_id: EST_ID,
        is_active: true
      });
    }
    console.log("✅ Profils utilisateurs d'élèves insérés.");

    // 6. Insert Students records
    await supabase.from("students").upsert([
      { id: "10000000-0000-0000-0000-000000000001", establishment_id: EST_ID, user_id: "10000000-0000-0000-0000-000000000001", student_number: "ET-2026-001", classroom_id: CLASS_3A, academic_year_id: ACADEMIC_YEAR_ID, status: "active" },
      { id: "20000000-0000-0000-0000-000000000002", establishment_id: EST_ID, user_id: "20000000-0000-0000-0000-000000000002", student_number: "ET-2026-002", classroom_id: CLASS_5B, academic_year_id: ACADEMIC_YEAR_ID, status: "active" },
      { id: "30000000-0000-0000-0000-000000000003", establishment_id: EST_ID, user_id: "30000000-0000-0000-0000-000000000003", student_number: "ET-2026-003", classroom_id: CLASS_TC, academic_year_id: ACADEMIC_YEAR_ID, status: "active" }
    ]);
    console.log("✅ Dossiers scolaires des élèves insérés.");

    // 7. Retrieve Admin User for payment logs (created_by column)
    const { data: superAdmins } = await supabase.from("users").select("id").eq("email", "etarcos3@gmail.com").single();
    const adminUserId = superAdmins?.id || "943dfe1d-f9db-4c72-bb74-dd1eeaf35fa1"; // fallback

    // 8. Insert Payments records
    await supabase.from("payments").upsert([
      {
        id: "a0000000-0000-0000-0000-000000000001",
        establishment_id: EST_ID,
        student_id: "10000000-0000-0000-0000-000000000001",
        fee_category_id: FEE_TUITION,
        academic_year_id: ACADEMIC_YEAR_ID,
        amount: 150000,
        amount_paid: 85000,
        status: "partial",
        due_date: "2026-07-01",
        payment_method: "cash",
        created_by: adminUserId,
        notes: "Acompte scolarité Trimestre 1"
      },
      {
        id: "a0000000-0000-0000-0000-000000000002",
        establishment_id: EST_ID,
        student_id: "20000000-0000-0000-0000-000000000002",
        fee_category_id: FEE_ENROLL,
        academic_year_id: ACADEMIC_YEAR_ID,
        amount: 120000,
        amount_paid: 120000,
        status: "paid",
        due_date: "2026-07-05",
        payment_method: "mobile_money",
        created_by: adminUserId,
        notes: "Paiement intégral inscription"
      },
      {
        id: "a0000000-0000-0000-0000-000000000003",
        establishment_id: EST_ID,
        student_id: "30000000-0000-0000-0000-000000000003",
        fee_category_id: FEE_TUITION,
        academic_year_id: ACADEMIC_YEAR_ID,
        amount: 150000,
        amount_paid: 65000,
        status: "partial",
        due_date: "2026-07-10",
        payment_method: "card",
        created_by: adminUserId,
        notes: "Acompte scolarité Trimestre 1"
      }
    ]);
    console.log("✅ Reçus et transactions de paiement insérés.");

    console.log("\n🎉 Base de données peuplée avec succès !");
  } catch (error) {
    console.error("\n❌ Échec du peuplement :", error.message);
  }
}

seed();
