# How to Test Worker App & Upload Photos

## Prerequisites Checklist

Run these in Supabase SQL Editor FIRST:

```sql
-- 1. Add missing column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photo_urls TEXT;

-- 2. Verify job_photos table exists
SELECT COUNT(*) FROM job_photos;
-- Should return 0 (or more if photos exist)

-- 3. Check if you have any completed jobs
SELECT * FROM jobs WHERE status = 'completed' LIMIT 5;
```

## Step-by-Step: Upload Test Photos

### 1. Start Worker App
```bash
cd C:\Users\mosaa\Desktop\m2\golden-angel-worker
npm start
```

### 2. Login
- Email: `john@goldenangel.com`
- (No password - just email)

### 3. You Should See Jobs
If you don't see any jobs, go to admin app and assign a job first:
- Admin App → Jobs tab → "Assign Job" button
- Select worker: John Worker
- Select a property
- Select today's date
- Click "Assign Job"

### 4. Complete a Job with Photos
1. In worker app, click on a job
2. Click "Start Job" button (status changes to "in_progress")
3. Click "📷 Take Before Photo" button
4. Take or select a photo
5. Click "📷 Take After Photo" button
6. Take or select another photo
7. Click "✓ Complete Job" button
8. **WAIT** for the message: "Job completed and photos uploaded!"

### 5. Verify Upload in Supabase
Go to Supabase Dashboard:
- Storage → job-photos bucket
- You should see folders with job IDs
- Inside: before-XXXXX.jpg and after-XXXXX.jpg files

### 6. Check Admin App
- Admin App → "Completed" tab
- Find the job you just completed
- Scroll down - you should see "Photos (2):"
- Click photos to view full screen
- Click "⬇ Download" to download

## Troubleshooting

### "No jobs assigned yet"
→ Go to admin app and assign jobs to workers

### Photos not uploading?
Check worker app console for errors:
- Right-click → Inspect → Console tab
- Look for red error messages

### "Failed to complete job" error?
Check if storage bucket exists:
- Supabase → Storage → Should see "job-photos" bucket
- If missing: Create bucket, make it PUBLIC

### Photos uploaded but not showing in admin?
Run this SQL to verify photos are in database:
```sql
SELECT
  j.id,
  p.property_name,
  j.status,
  COUNT(jp.id) as photo_count,
  string_agg(jp.photo_type, ', ') as photo_types
FROM jobs j
LEFT JOIN properties p ON j.property_id = p.id
LEFT JOIN job_photos jp ON j.id = jp.job_id
WHERE j.status = 'completed'
GROUP BY j.id, p.property_name, j.status
ORDER BY j.created_at DESC;
```

If photo_count > 0, photos exist but display is broken.
If photo_count = 0, photos didn't upload - check worker app console.
