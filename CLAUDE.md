# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Golden Angel Snow Removal Admin Dashboard - A React-based web application for managing snow removal operations, including workers, clients, properties, and jobs.

**Tech Stack:**
- React 19.2.1 with Create React App
- Supabase for backend (database, storage, real-time)
- Lucide React for icons
- Inline styling (no CSS framework)

## Common Commands

### Development
```bash
npm start          # Start dev server on http://localhost:3000
npm test           # Run tests in watch mode
npm run build      # Production build to ./build directory
```

### Testing
```bash
npm test           # Interactive test runner
npm test -- --coverage  # Run tests with coverage report
```

## Architecture

### Database Schema (Supabase)

The app connects to Supabase and uses the following tables:

1. **profiles** (auth.users linked) - Workers and users
   - Fields: id (UUID, matches auth.users.id), full_name, email, phone, role, created_at, updated_at
   - Role values: 'worker', 'admin'
   - Linked to Supabase Auth for password authentication
   - RLS policies: public read, restricted update (own profile only)

2. **clients** - Property owners
   - Fields: id, name, email, phone, created_at
   - Cascade deletes properties and jobs

3. **properties** - Service locations
   - Fields: id, client_id (FK), property_name, address, latitude, longitude, highlight_photo_url, special_notes, checklist, created_at
   - checklist stored as JSON string: array of `{item: string, checked: boolean}`
   - Foreign key: clients(id)
   - Cascade deletes jobs

4. **jobs** - Work assignments
   - Fields: id, property_id (FK), worker_id (FK), scheduled_date, status, published, is_vip, deadline_time, estimated_duration_minutes, actual_duration_minutes, started_at, finished_at, created_at
   - Status values: 'assigned', 'in_progress', 'completed'
   - published: boolean (controls worker visibility)
   - is_vip: boolean (priority jobs appear first)
   - Time tracking: started_at, finished_at, actual_duration_minutes
   - Foreign keys: properties(id), profiles(id)
   - Joined with job_photos for photo display

5. **job_photos** - Photos from completed jobs
   - Fields: id, job_id (FK), photo_type, photo_url, storage_path, created_at
   - photo_type values: 'before', 'after'
   - Foreign key: jobs(id)

6. **job_issues** - Worker-reported issues
   - Fields: id, job_id (FK), issue_type, description, resolved, created_at
   - issue_type values: 'access', 'equipment', 'weather', 'other'
   - resolved: boolean
   - Foreign key: jobs(id)

### Supabase Storage

Uses `job-photos` bucket for:
- Property highlight photos (stored as `property-photos/{random}.{ext}`)
- Job completion photos (managed by mobile app)

### Component Structure

**Single Page Application** - All UI is in `src/App.js` (AdminDashboard component):

- **State Management**: useState hooks for data, modals, forms, search
- **Data Loading**: useEffect loads all data on mount via loadAllData()
- **Views**: Dashboard, Workers, Clients, Properties, Jobs, Today's Jobs, Completed, Pending
- **Modals**: Worker, Client, Property, Job assignment
- **Reusable Components**: SearchableDropdown, SearchBar

### Key Patterns

1. **CRUD Operations**: All use async/await with Supabase client
   - Success/errors shown via alert()
   - After mutations, reload affected data tables

2. **Form Handling**: Separate state for each entity type (workerForm, clientForm, propertyForm, jobForm)
   - Edit mode detected via editingItem state
   - Modal controls via boolean flags (showWorkerModal, etc.)

3. **Checklist System**: Property checklists use predefined templates (CHECKLIST_TEMPLATES) plus custom items
   - Selected items tracked in selectedChecklistItems array
   - Stored as JSON in database

4. **Photo Upload**: Direct upload to Supabase storage, returns public URL
   - Property photos stored in highlight_photos array in form state
   - Multiple photos supported, first photo used as highlight_photo_url

5. **Search/Filter**: Client-side filtering using searchTerm state
   - Applied to workers (name, email), clients (name), properties (name, address), jobs (property name, worker name)

### Supabase Connection

Configuration in `src/supabaseClient.js`:
- Exports configured supabase client
- **IMPORTANT**: Contains production credentials - do not commit changes to this file

## System Integration

This is the **admin-facing web dashboard** of a two-app system:

1. **Admin Dashboard** (this repo): Web app for administrators
   - Manage workers, clients, properties
   - Assign jobs to workers
   - View completed jobs and photos
   - Located at: `golden-angel-admin`

2. **Worker Mobile App**: React Native app for field workers
   - Login with email and password (Supabase Auth)
   - View assigned and published jobs only
   - Start/complete jobs with before/after photos
   - Upload photos to Supabase storage
   - Read property checklists and special instructions
   - Report issues (access problems, equipment failures, etc.)
   - Navigate to job locations via Google Maps integration
   - Time tracking for jobs (actual duration vs estimated)
   - Password reset via admin
   - Located at: `golden-angel-worker` (sibling directory)

**Shared Backend**: Both apps connect to the same Supabase instance
- Same database tables (profiles, clients, properties, jobs, job_photos, job_issues)
- Same storage bucket (job-photos)
- Credentials in both supabaseClient files are identical
- RPC functions for admin operations (create_worker_profile, update_worker_profile)

**Workflow:**
1. Admin creates workers with email/password (admin dashboard)
2. Admin creates clients and properties (admin dashboard)
3. Admin assigns jobs to workers and publishes them (admin dashboard)
4. Worker logs in with email/password (mobile app)
5. Worker sees only published jobs assigned to them (mobile app)
6. Worker starts job, takes before photos (mobile app)
7. Worker completes job, takes after photos (mobile app)
8. Photos uploaded to Supabase storage (mobile app)
9. Admin views completed jobs with photos (admin dashboard)
10. Admin can see reported issues and mark as resolved (admin dashboard)

## Development Notes

- **No TypeScript**: Pure JavaScript with JSX
- **Styling**: All inline styles, no CSS-in-JS library
- **No Router**: Single page, tab-based navigation (admin), Expo Router with tabs (mobile)
- **Data Relationships**: Deleting clients cascades to properties and jobs; deleting properties cascades to jobs
- **Real-time**: Not currently implemented, but Supabase supports it if needed
- **Photo Upload**:
  - Admin uploads property photos via web
  - Workers upload job photos (before/after) via mobile app
  - All photos stored in Supabase storage `job-photos` bucket
  - Unique filenames with timestamp + index + random ID to prevent collisions
- **Authentication**:
  - Supabase Auth for workers (email + password)
  - RPC functions with SECURITY DEFINER to bypass RLS for admin operations
  - Password reset requires admin to delete/recreate worker account
- **Job Publishing**:
  - Global toggle to publish/unpublish all jobs at once
  - Individual job publish toggle
  - Workers only see published jobs
- **Time Tracking**:
  - Admin sets estimated duration when creating jobs
  - Worker app tracks actual time (started_at to finished_at)
  - Admin dashboard shows comparison
- **Issue Reporting**:
  - Workers can report issues during jobs
  - Issues tracked in job_issues table
  - Admin can view and mark as resolved
