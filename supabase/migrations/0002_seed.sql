-- Seed initial listing categories
INSERT INTO public.listing_categories (id, slug, name, description, is_active, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'mlbb-accounts', 'Mobile Legends Accounts', 'Mobile Legends: Bang Bang accounts with skin count, collector level, and rank details.', true, now()),
  ('11111111-1111-4111-8111-111111111102', 'skins-items', 'Skins & In-Game Items', 'Giftable skins, starlight passes, and permitted in-game items.', true, now()),
  ('11111111-1111-4111-8111-111111111103', 'diamonds-topup', 'Diamonds & Top-Ups', 'Authorized diamond top-ups and recharge bundles.', true, now()),
  ('11111111-1111-4111-8111-111111111104', 'pilot-boosting', 'Pilot & Rank Services', 'Rank boosting, classic winrate, and MMR services.', true, now())
ON CONFLICT (slug) DO NOTHING;

-- Seed hardcoded verified Midmen (admin-verified)
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'midman.kaito@mlbnsph.com', now(), now()),
  ('22222222-2222-4222-8222-222222222202', 'midman.ryuji@mlbnsph.com', now(), now()),
  ('22222222-2222-4222-8222-222222222203', 'midman.hana@mlbnsph.com', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, user_id, username, display_name, bio, status, created_at, updated_at)
VALUES
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'mm_kaito_ph', 'Kaito MM (Official)', 'Founder & lead verified midman for MLBNSPH.com. Fast GCash/Maya/Bank verification.', 'ACTIVE', now(), now()),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'mm_ryuji_ph', 'Ryuji MM', 'Trusted PH midman handling high-tier Collector & Mythical Immortal trades.', 'ACTIVE', now(), now()),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222203', 'mm_hana_ph', 'Hana MM', 'Evening & weekend midman specialist. Transparent step-by-step coordination.', 'ACTIVE', now(), now())
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (id, user_id, role, created_at)
VALUES
  ('44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', 'MIDMAN', now()),
  ('44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222202', 'MIDMAN', now()),
  ('44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222203', 'MIDMAN', now())
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.midman_profiles (id, user_id, display_name, bio, verification_status, fee_description, availability_status, completed_count, rating_average, verified_at, created_at, updated_at)
VALUES
  ('55555555-5555-4555-8555-555555555501', '22222222-2222-4222-8222-222222222201', 'Kaito MM (Official)', 'Lead verified midman for MLBNSPH.com. Strict receipt & actual payment verification before handoff.', 'VERIFIED', 'PHP 50 flat (< PHP 2,000) / 3% (>= PHP 2,000)', 'AVAILABLE', 142, 4.98, now(), now(), now()),
  ('55555555-5555-4555-8555-555555555502', '22222222-2222-4222-8222-222222222202', 'Ryuji MM', 'Specializing in high-value World Collector & Mythical Immortal transactions.', 'VERIFIED', 'PHP 100 flat (< PHP 5,000) / 2.5% (>= PHP 5,000)', 'AVAILABLE', 89, 4.95, now(), now(), now()),
  ('55555555-5555-4555-8555-555555555503', '22222222-2222-4222-8222-222222222203', 'Hana MM', 'Active 6 PM - 2 AM PHT. Patient, clear guidance for first-time buyers and sellers.', 'VERIFIED', 'PHP 50 flat (< PHP 1,500) / 3% (>= PHP 1,500)', 'BUSY', 64, 4.92, now(), now(), now())
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.midman_socials (id, midman_profile_id, platform, url, handle)
VALUES
  ('66666666-6666-4666-8666-666666666601', '55555555-5555-4555-8555-555555555501', 'Facebook', 'https://facebook.com/mlbnsph', '@mlbnsph.kaito'),
  ('66666666-6666-4666-8666-666666666602', '55555555-5555-4555-8555-555555555501', 'Discord', 'https://discord.com', 'kaito#0001'),
  ('66666666-6666-4666-8666-666666666603', '55555555-5555-4555-8555-555555555502', 'Facebook', 'https://facebook.com/mlbnsph', '@mlbnsph.ryuji'),
  ('66666666-6666-4666-8666-666666666604', '55555555-5555-4555-8555-555555555503', 'Facebook', 'https://facebook.com/mlbnsph', '@mlbnsph.hana')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.midman_payment_methods (id, midman_profile_id, method_name, account_name, account_number_masked, is_active)
VALUES
  ('77777777-7777-4777-8777-777777777701', '55555555-5555-4555-8555-555555555501', 'GCash', 'Kaito M.', '0917-***-4821', true),
  ('77777777-7777-4777-8777-777777777702', '55555555-5555-4555-8555-555555555501', 'Maya', 'Kaito M.', '0917-***-4821', true),
  ('77777777-7777-4777-8777-777777777703', '55555555-5555-4555-8555-555555555502', 'GCash', 'Ryuji S.', '0998-***-1934', true),
  ('77777777-7777-4777-8777-777777777704', '55555555-5555-4555-8555-555555555502', 'UnionBank', 'Ryuji S.', '****-****-9042', true),
  ('77777777-7777-4777-8777-777777777705', '55555555-5555-4555-8555-555555555503', 'GCash', 'Hana R.', '0915-***-7712', true)
ON CONFLICT (id) DO NOTHING;
