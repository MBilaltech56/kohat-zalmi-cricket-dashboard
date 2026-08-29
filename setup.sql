-- KOHAT ZALMI — SUPABASE SECURITY SETUP
-- Run this entire file once in Supabase SQL Editor.
-- Owner UUID: f62ca7bc-486d-462f-92dd-6415e0e90973
-- Tables: public."kohat zalmi" and public.matches

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('kohat zalmi','matches')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE public."kohat zalmi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public."kohat zalmi" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."kohat zalmi" TO authenticated;
GRANT SELECT ON TABLE public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.matches TO authenticated;

CREATE POLICY "Public can view players"
ON public."kohat zalmi" FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can view matches"
ON public.matches FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can insert players"
ON public."kohat zalmi" FOR INSERT TO authenticated
WITH CHECK (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

CREATE POLICY "Owner can update players"
ON public."kohat zalmi" FOR UPDATE TO authenticated
USING (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid)
WITH CHECK (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

CREATE POLICY "Owner can delete players"
ON public."kohat zalmi" FOR DELETE TO authenticated
USING (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

CREATE POLICY "Owner can insert matches"
ON public.matches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

CREATE POLICY "Owner can update matches"
ON public.matches FOR UPDATE TO authenticated
USING (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid)
WITH CHECK (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

CREATE POLICY "Owner can delete matches"
ON public.matches FOR DELETE TO authenticated
USING (auth.uid() = 'f62ca7bc-486d-462f-92dd-6415e0e90973'::uuid);

-- Needed only if either table uses a sequence/identity column for inserts.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
