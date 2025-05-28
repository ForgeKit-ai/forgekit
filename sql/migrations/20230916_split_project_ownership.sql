-- Migration: Split project ownership from participation
-- Creates user_projects join table and migrates existing data.
--
-- This assumes an existing "projects" table with a "user_id" column referencing
-- "auth.users(id)". After migration the "user_id" column will be removed and
-- project membership will be tracked in "user_projects" with a role column.

BEGIN;

-- 1. Create projects table if it does not exist (id, slug, url, created_at)
--    Feel free to drop this block if the table already exists.
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. Create join table mapping users to projects and their role
CREATE TABLE IF NOT EXISTS user_projects (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner',
  PRIMARY KEY (user_id, project_id)
);

-- 3. If "projects" currently has a "user_id" column, copy ownership info
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='projects'
      AND column_name='user_id'
  ) THEN
    INSERT INTO user_projects (user_id, project_id, role)
    SELECT user_id, id, 'owner'
    FROM projects
    ON CONFLICT DO NOTHING;

    ALTER TABLE projects DROP COLUMN user_id;
  END IF;
END$$;

-- 4. Enable RLS on user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- 5. Only allow members to read their rows
DROP POLICY IF EXISTS "Only project members can access" ON user_projects;
CREATE POLICY "Only project members can access" ON user_projects
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;
