import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const priority = searchParams.get('priority');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const tasks = await prisma.task.findMany({
    where: {
      userId: (session.user as { id: string }).id,
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
      ...(search ? { title: { contains: search } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, priority, status, dueDate } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description || null,
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
