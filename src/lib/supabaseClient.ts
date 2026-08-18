import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acwfzbmhkamxhdlfhaij.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Lk7Js8kuDuUZ2MS8aRdudA_4XdSA1mD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
