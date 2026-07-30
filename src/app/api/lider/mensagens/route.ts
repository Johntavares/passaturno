import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turma = searchParams.get('turma');

    const where: any = {};
    if (turma && turma !== 'TODAS') {
      where.targetTurma = { in: [turma, 'GERAL'] };
    }

    const messages = await prisma.leaderMessage.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, senderId, targetTurma, text } = body;

    if (!sender || !targetTurma || !text) {
      return NextResponse.json({ error: 'sender, targetTurma e text são obrigatórios' }, { status: 400 });
    }

    const message = await prisma.leaderMessage.create({
      data: { sender, senderId, targetTurma, text },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
