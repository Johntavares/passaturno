import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turma = searchParams.get('turma');

    const where: any = {};
    if (turma) {
      where.fromTurma = turma;
    }

    const replies = await prisma.operatorReply.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, senderId, fromTurma, text } = body;

    if (!sender || !fromTurma || !text) {
      return NextResponse.json({ error: 'sender, fromTurma e text são obrigatórios' }, { status: 400 });
    }

    const reply = await prisma.operatorReply.create({
      data: { sender, senderId, fromTurma, text },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    return NextResponse.json({ error: 'Erro ao enviar resposta' }, { status: 500 });
  }
}
