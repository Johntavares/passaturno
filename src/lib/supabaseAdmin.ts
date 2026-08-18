import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acwfzbmhkamxhdlfhaij.supabase.co';
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// NUNCA passar chave vazia para o createClient: ele lança "supabaseKey is required"
// durante a coleta de dados das rotas no build do Vercel e derruba o deploy.
// Com o placeholder, o build passa; as chamadas REST retornam 401 e as rotas caem no fallback Prisma.
if (!serviceRoleKey) {
  console.error('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY não definida! Gravações via REST ficarão indisponíveis (fallback Prisma ativo).');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || 'missing-key-placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});