-- =====================================================
-- ScanLedger – Supabase Database Schema
-- Version: 1.0 | Author: Rusel Portes | July 30, 2026
-- =====================================================
-- Run this entire script in your Supabase SQL Editor

-- ─── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users with role and display name
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('staff', 'owner')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Logbook Uploads ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_uploads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL,
  staff_id        UUID NOT NULL REFERENCES public.profiles(id),
  image_url       TEXT,
  total_entries   INT NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_synced       BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Logbook Entries ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id       UUID NOT NULL REFERENCES public.logbook_uploads(id) ON DELETE CASCADE,
  original_text   TEXT NOT NULL,
  name            TEXT NOT NULL,
  amount          NUMERIC(10,2),           -- NULL means name-only entry
  is_confirmed    BOOLEAN NOT NULL DEFAULT TRUE,
  is_duplicate    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Devices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_name     TEXT NOT NULL,
  owner_id        UUID NOT NULL REFERENCES public.profiles(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_uploads_date        ON public.logbook_uploads(date);
CREATE INDEX IF NOT EXISTS idx_uploads_staff_id    ON public.logbook_uploads(staff_id);
CREATE INDEX IF NOT EXISTS idx_uploads_is_synced   ON public.logbook_uploads(is_synced);
CREATE INDEX IF NOT EXISTS idx_entries_upload_id   ON public.logbook_entries(upload_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_uploads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices          ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update only their own
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Uploads: staff can insert their own; everyone authenticated can read
CREATE POLICY "uploads_select"        ON public.logbook_uploads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "uploads_insert_staff"  ON public.logbook_uploads FOR INSERT WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "uploads_update_staff"  ON public.logbook_uploads FOR UPDATE USING (auth.uid() = staff_id);

-- Entries: authenticated users can read; staff can insert via their uploads
CREATE POLICY "entries_select"        ON public.logbook_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "entries_insert"        ON public.logbook_entries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.logbook_uploads u WHERE u.id = upload_id AND u.staff_id = auth.uid())
);

-- Devices: only owners can manage
CREATE POLICY "devices_select"        ON public.devices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "devices_insert_owner"  ON public.devices FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "devices_update_owner"  ON public.devices FOR UPDATE USING (auth.uid() = owner_id);

-- ─── Seed: Create Demo Owner (run manually, replace with real values) ─────────
-- After creating your first user in Supabase Auth, run:
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'owner@yourgym.com';

-- ─── Migration: Add is_active column (run if profiles table already exists) ──
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
