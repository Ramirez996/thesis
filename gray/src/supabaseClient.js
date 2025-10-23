// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'postgresql://postgres.lrsfyzndkmmtgrlnvwvy:ramirezdb2025!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyc2Z5em5ka21tdGdybG52d3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzgxMjAsImV4cCI6MjA3NDYxNDEyMH0.ajJDHKrLHKupp6dWCI-JOyg3NOg2Fi3NeIXUinVdX6s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
    