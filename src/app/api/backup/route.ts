import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Tenta carregar dados completos via Prisma
    let users: any[] = [];
    let shifts: any[] = [];
    let equipments: any[] = [];
    let incidents: any[] = [];
    let incidentHistories: any[] = [];
    let categories: any[] = [];
    let boletimConfig: any[] = [];
    let boletimCarteira: any[] = [];

    try {
      [
        users,
        shifts,
        equipments,
        incidents,
        incidentHistories,
        categories,
        boletimConfig,
        boletimCarteira,
      ] = await Promise.all([
        prisma.user.findMany().catch(() => []),
        prisma.shift.findMany({ orderBy: { criadoEm: 'desc' } }).catch(() => []),
        prisma.equipment.findMany({ orderBy: { tag: 'asc' } }).catch(() => []),
        prisma.incident.findMany({ orderBy: { criadoEm: 'desc' } }).catch(() => []),
        prisma.incidentHistory.findMany({ orderBy: { dataHora: 'desc' } }).catch(() => []),
        prisma.failureCategory.findMany().catch(() => []),
        prisma.boletimConfig.findMany().catch(() => []),
        prisma.boletimCarteira.findMany().catch(() => []),
      ]);
    } catch (prismaErr) {
      console.warn('Prisma backup fallback para Supabase REST:', prismaErr);
      // Fallback para Supabase REST se o Prisma oscilar
      const [uRes, sRes, eRes, iRes, hRes, cRes] = await Promise.all([
        Promise.resolve(supabase.from('User').select('*')).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from('Shift').select('*')).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from('Equipment').select('*')).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from('Incident').select('*')).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from('IncidentHistory').select('*')).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from('FailureCategory').select('*')).catch(() => ({ data: [] })),
      ]);
      users = (uRes as any).data || [];
      shifts = (sRes as any).data || [];
      equipments = (eRes as any).data || [];
      incidents = (iRes as any).data || [];
      incidentHistories = (hRes as any).data || [];
      categories = (cRes as any).data || [];
    }

    const backupPayload = {
      system: 'PassaTurno - Sistema de Passagem de Turno CCO',
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        shifts: shifts.length,
        equipments: equipments.length,
        incidents: incidents.length,
        incidentHistories: incidentHistories.length,
        categories: categories.length,
        boletimConfig: boletimConfig.length,
        boletimCarteira: boletimCarteira.length,
      },
      data: {
        users,
        shifts,
        equipments,
        incidents,
        incidentHistories,
        categories,
        boletimConfig,
        boletimCarteira,
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="passaturno_backup_${dateStr}.json"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar backup:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar arquivo de backup', details: error.message },
      { status: 500 }
    );
  }
}
