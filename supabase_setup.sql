-- ================================================================
-- SETUP SUPABASE — UPeU Horarios Académicos
-- Ejecutar en: https://supabase.com/dashboard/project/kofrjygksvxckainxino/sql
-- ================================================================

-- 1. Tabla de facultades
CREATE TABLE IF NOT EXISTS faculties (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de carreras (escuelas profesionales)
CREATE TABLE IF NOT EXISTS careers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id   TEXT        NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  img          TEXT        NOT NULL,
  schedule_url TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Desactivar RLS para acceso con clave pública (anon key)
ALTER TABLE faculties DISABLE ROW LEVEL SECURITY;
ALTER TABLE careers   DISABLE ROW LEVEL SECURITY;

-- 4. Índice para consultas por facultad
CREATE INDEX IF NOT EXISTS careers_faculty_id_idx ON careers(faculty_id);

-- ================================================================
-- STORAGE — Ejecutar también en SQL Editor
-- ================================================================

-- Bucket para imágenes (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket para PDFs de horarios (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedules', 'schedules', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política: cualquiera puede leer los archivos (buckets públicos)
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Public read schedules"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedules');

-- Política: cualquiera puede subir archivos (clave anon)
CREATE POLICY "Public upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public upload schedules"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'schedules');

-- Política: cualquiera puede actualizar archivos
CREATE POLICY "Public update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

CREATE POLICY "Public update schedules"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'schedules');
