import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmfxkffyimjliielxzso.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_EfYT78CDCBuJzO64HsOXQg_O_yrdtez';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
