
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbmnwphxjcvctdkmbuwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibW53cGh4amN2Y3Rka21idXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTM1MTQsImV4cCI6MjA4MDEyOTUxNH0.ROdSBbsSBnM4lKbBbMeZHdeY57_LzgApJ__rgqVWqVI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('Testing connection to:', SUPABASE_URL);
    try {
        const { data, error } = await supabase.from('jobs').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Error:', error.message);
            console.error('Details:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Data access verified. Jobs table exists.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testConnection();
