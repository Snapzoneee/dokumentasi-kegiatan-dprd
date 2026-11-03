import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireSession } from '@/lib/auth';
import { categorySchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';

export async function GET() {
  try { await requireSession(); const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { activities: true } } } }); return NextResponse.json({ categories }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { await requireAdmin(); const parsed = categorySchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 }); const category = await prisma.category.create({ data: parsed.data }); return NextResponse.json({ category }, { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
