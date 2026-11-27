-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midman_socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midman_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;

-- Users: users can read their own record
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- User roles: users can read their own roles (no client writes allowed)
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- User profiles: public read, owner update
DROP POLICY IF EXISTS "user_profiles_select_public" ON public.user_profiles;
CREATE POLICY "user_profiles_select_public" ON public.user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Listing categories: public read
DROP POLICY IF EXISTS "listing_categories_select_public" ON public.listing_categories;
CREATE POLICY "listing_categories_select_public" ON public.listing_categories
  FOR SELECT USING (is_active = true);

-- Listings: public read for ACTIVE, owner read/write for own listings
DROP POLICY IF EXISTS "listings_select_active_or_owner" ON public.listings;
CREATE POLICY "listings_select_active_or_owner" ON public.listings
  FOR SELECT USING (status = 'ACTIVE' OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
CREATE POLICY "listings_insert_own" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
CREATE POLICY "listings_update_own" ON public.listings
  FOR UPDATE USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
CREATE POLICY "listings_delete_own" ON public.listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Listing media: public read for active listings or owner, owner write
DROP POLICY IF EXISTS "listing_media_select_public" ON public.listing_media;
CREATE POLICY "listing_media_select_public" ON public.listing_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND (l.status = 'ACTIVE' OR l.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "listing_media_insert_own" ON public.listing_media;
CREATE POLICY "listing_media_insert_own" ON public.listing_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "listing_media_delete_own" ON public.listing_media;
CREATE POLICY "listing_media_delete_own" ON public.listing_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

-- Midman profiles: public read for VERIFIED midmen (or own profile)
DROP POLICY IF EXISTS "midman_profiles_select_verified" ON public.midman_profiles;
CREATE POLICY "midman_profiles_select_verified" ON public.midman_profiles
  FOR SELECT USING (verification_status = 'VERIFIED' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "midman_socials_select_verified" ON public.midman_socials;
CREATE POLICY "midman_socials_select_verified" ON public.midman_socials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.midman_profiles mp
      WHERE mp.id = midman_profile_id AND (mp.verification_status = 'VERIFIED' OR mp.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "midman_payment_methods_select_verified" ON public.midman_payment_methods;
CREATE POLICY "midman_payment_methods_select_verified" ON public.midman_payment_methods
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.midman_profiles mp
      WHERE mp.id = midman_profile_id AND (mp.verification_status = 'VERIFIED' OR mp.user_id = auth.uid())
    )
  );

-- Trigger to provision public.users, user_profiles, and default BUYER/SELLER roles on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_display_name text;
BEGIN
  v_display_name := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1));
  v_username := COALESCE(
    NULLIF(regexp_replace(lower(trim(new.raw_user_meta_data->>'username')), '[^a-z0-9_]', '', 'g'), ''),
    regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g') || '_' || substr(new.id::text, 1, 6)
  );

  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();

  INSERT INTO public.user_profiles (id, user_id, username, display_name, status, created_at, updated_at)
  VALUES (gen_random_uuid(), new.id, v_username, v_display_name, 'ACTIVE', now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (id, user_id, role, created_at)
  VALUES
    (gen_random_uuid(), new.id, 'BUYER', now()),
    (gen_random_uuid(), new.id, 'SELLER', now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Storage bucket for public listing media (0.5MB images, 15MB videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-listings',
  'public-listings',
  true,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_listings_read" ON storage.objects;
CREATE POLICY "public_listings_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-listings');

DROP POLICY IF EXISTS "public_listings_insert_own" ON storage.objects;
CREATE POLICY "public_listings_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "public_listings_delete_own" ON storage.objects;
CREATE POLICY "public_listings_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
