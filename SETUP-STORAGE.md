# Supabase Storage Setup for Job Photos

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Click on "Storage" in the left sidebar
3. Click "Create a new bucket"
4. Enter these details:
   - **Name**: `job-photos`
   - **Public bucket**: ✅ YES (check this box)
   - Click "Create bucket"

## Step 2: Set Bucket Policies (Important!)

After creating the bucket, you need to add policies so workers can upload photos:

1. Click on the `job-photos` bucket
2. Click on "Policies" tab
3. Click "New Policy"
4. Click "For full customization"

### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');
```

### Policy 2: Allow Public Read Access
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');
```

### Policy 3: Allow Authenticated Users to Update
```sql
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job-photos');
```

## Step 3: Verify Setup

Run this query in SQL Editor to check completed jobs and their photos:

```sql
SELECT
  j.id,
  p.property_name,
  w.name as worker_name,
  j.status,
  j.end_time,
  COUNT(jp.id) as photo_count,
  json_agg(json_build_object('type', jp.photo_type, 'url', jp.photo_url)) as photos
FROM jobs j
LEFT JOIN properties p ON j.property_id = p.id
LEFT JOIN workers w ON j.worker_id = w.id
LEFT JOIN job_photos jp ON j.id = jp.job_id
WHERE j.status = 'completed'
GROUP BY j.id, p.property_name, w.name, j.status, j.end_time
ORDER BY j.end_time DESC
LIMIT 10;
```

## Step 4: Test Photo Upload

1. Open the worker app (mobile)
2. Login as a worker
3. Start a job
4. Take at least 1 before photo
5. Take at least 1 after photo
6. Click "Complete Job"
7. Wait for "Job completed and photos uploaded!" message
8. Go to admin dashboard
9. Navigate to "Jobs" tab
10. Find the completed job - you should see the photos!

## Troubleshooting

### Photos not showing in admin?
- Check if the `job_photos` table exists (run create-job-photos-table.sql)
- Check if photos are in storage: Go to Storage > job-photos in Supabase dashboard
- Check browser console for errors when viewing jobs

### Worker app upload failing?
- Check if storage bucket exists and is public
- Check if policies are set up correctly
- Check worker app console for error messages
- Verify Supabase credentials are correct in both apps

### No completed jobs?
- Make sure you've assigned jobs to workers
- Make sure workers have completed jobs with photos
- Check the "Completed" tab in admin dashboard
