import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acwfzbmhkamxhdlfhaij.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// NUNCA lançar erro na importação: build do Vercel avalia os módulos das rotas.
// Sem a chave, as chamadas REST falham (401) e as rotas caem no fallback Prisma.
if (!serviceRoleKey) {
  console.error('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY não definida! Gravações via REST ficarão indisponíveis (fallback Prisma ativo).');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});