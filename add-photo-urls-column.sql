-- Add photo_urls column to properties table
-- Run this in your Supabase SQL Editor

ALTER TABLE properties ADD COLUMN IF NOT EXISTS photo_urls TEXT;

-- Optional: Migrate existing single photos to the new array format
UPDATE properties
SET photo_urls = json_build_array(highlight_photo_url)::text
WHERE highlight_photo_url IS NOT NULL AND photo_urls IS NULL;
