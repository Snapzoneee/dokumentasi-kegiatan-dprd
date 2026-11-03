import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { categorySchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try { await requireAdmin(); const { id } = await params; const parsed = categorySchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 }); const category = await prisma.category.update({ where: { id }, data: parsed.data }); return NextResponse.json({ category }); }
  catch (error) { return errorResponse(error); }
}
export async function DELETE(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { id } = await params; await prisma.category.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
