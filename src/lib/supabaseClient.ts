import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acwfzbmhkamxhdlfhaij.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjd2Z6Ym1oa2FteGhkbGZoYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDM0MDEsImV4cCI6MjEwMjE3OTQwMX0.xicr6Z3O_naCK65FtMWbFh6zraGvxBRxjjfoBBr0tBs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
