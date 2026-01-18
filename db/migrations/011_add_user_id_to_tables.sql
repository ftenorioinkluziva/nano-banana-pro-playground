-- Migration: Add user_id column to tables for multi-tenancy
-- This adds user_id to all tables that need it and creates foreign key constraints

-- Add user_id to generations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE generations ADD COLUMN user_id TEXT;
    ALTER TABLE generations ADD CONSTRAINT generations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    COMMENT ON COLUMN generations.user_id IS 'User who created this generation';
  END IF;
END $$;

-- Add user_id to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE videos ADD COLUMN user_id TEXT;
    ALTER TABLE videos ADD CONSTRAINT videos_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    COMMENT ON COLUMN videos.user_id IS 'User who created this video';
  END IF;
END $$;

-- Add user_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products ADD COLUMN user_id TEXT;
    ALTER TABLE products ADD CONSTRAINT products_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    COMMENT ON COLUMN products.user_id IS 'User who owns this product';
  END IF;
END $$;

-- Add user_id to brands table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brands' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE brands ADD COLUMN user_id TEXT;
      ALTER TABLE brands ADD CONSTRAINT brands_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
      COMMENT ON COLUMN brands.user_id IS 'User who owns this brand';
    END IF;
  END IF;
END $$;

-- Add user_id to scripts table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scripts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'scripts' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE scripts ADD COLUMN user_id TEXT;
      ALTER TABLE scripts ADD CONSTRAINT scripts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
      COMMENT ON COLUMN scripts.user_id IS 'User who owns this script';
    END IF;
  END IF;
END $$;
