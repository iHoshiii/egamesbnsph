import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url || !serviceKey || !dbUrl) {
  throw new Error("Missing Supabase or database credentials in .env");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const pool = new pg.Pool({ connectionString: dbUrl });

const ACCOUNTS = [
  {
    email: "buyer@egamesbnsph.com",
    password: "password123",
    username: "demo_buyer",
    displayName: "Demo Buyer",
    roles: ["BUYER", "SELLER"],
  },
  {
    email: "seller@egamesbnsph.com",
    password: "password123",
    username: "demo_seller",
    displayName: "Demo Seller",
    roles: ["BUYER", "SELLER"],
  },
  {
    email: "midman@egamesbnsph.com",
    password: "password123",
    username: "demo_midman",
    displayName: "Demo Midman (Verified)",
    roles: ["BUYER", "SELLER", "MIDMAN"],
    isMidman: true,
  },
  {
    email: "admin@egamesbnsph.com",
    password: "password123",
    username: "demo_admin",
    displayName: "Platform Admin",
    roles: ["BUYER", "SELLER", "ADMIN"],
  },
];

async function ensureAuthUser(acc) {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = listData.users.find((u) => u.email === acc.email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password: acc.password,
      email_confirm: true,
    });
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { username: acc.username, display_name: acc.displayName },
  });
  if (error) throw error;
  return data.user.id;
}

async function seed() {
  for (const acc of ACCOUNTS) {
    const userId = await ensureAuthUser(acc);

    await pool.query(
      `INSERT INTO public.users (id, email, created_at, updated_at)
       VALUES ($1, $2, now(), now())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()`,
      [userId, acc.email],
    );

    await pool.query(
      `INSERT INTO public.user_profiles (id, user_id, username, display_name, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', now(), now())
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()`,
      [userId, acc.username, acc.displayName],
    );

    for (const role of acc.roles) {
      await pool.query(
        `INSERT INTO public.user_roles (id, user_id, role, created_at)
         VALUES (gen_random_uuid(), $1, $2::"AppRole", now())
         ON CONFLICT (user_id, role) DO NOTHING`,
        [userId, role],
      );
    }

    if (acc.isMidman) {
      const mmRes = await pool.query(
        `INSERT INTO public.midman_profiles (id, user_id, display_name, bio, verification_status, fee_description, availability_status, verified_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'Verified demo midman account for testing.', 'VERIFIED', 'PHP 50 flat (< PHP 2,000) / 3% (>= PHP 2,000)', 'AVAILABLE', now(), now(), now())
         ON CONFLICT (user_id) DO UPDATE SET verification_status = 'VERIFIED', updated_at = now()
         RETURNING id`,
        [userId, acc.displayName],
      );
      const mmId = mmRes.rows[0].id;
      await pool.query(
        `INSERT INTO public.midman_payment_methods (id, midman_profile_id, method_name, account_name, account_number_masked, is_active)
         SELECT gen_random_uuid(), $1, 'GCash', 'Demo Midman', '0917-***-0001', true
         WHERE NOT EXISTS (SELECT 1 FROM public.midman_payment_methods WHERE midman_profile_id = $1)`,
        [mmId],
      );
    }

    console.log(`Ready: ${acc.email} (${acc.roles.join(", ")})`);
  }
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
