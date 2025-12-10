// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// REPLACE THESE with your actual Supabase credentials from Step 4 earlier
const SUPABASE_URL = 'https://dbmnwphxjcvctdkmbuwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibW53cGh4amN2Y3Rka21idXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTM1MTQsImV4cCI6MjA4MDEyOTUxNH0.ROdSBbsSBnM4lKbBbMeZHdeY57_LzgApJ__rgqVWqVI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);