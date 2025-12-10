-- Create job_photos table if it doesn't exist
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);

-- Check if table has any data
SELECT
  j.id as job_id,
  p.property_name,
  j.status,
  COUNT(jp.id) as photo_count
FROM jobs j
LEFT JOIN properties p ON j.property_id = p.id
LEFT JOIN job_photos jp ON j.id = jp.job_id
WHERE j.status = 'completed'
GROUP BY j.id, p.property_name, j.status
ORDER BY j.created_at DESC
LIMIT 10;
