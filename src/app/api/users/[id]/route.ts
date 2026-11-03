import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { userSchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try { const admin = await requireAdmin(); const { id } = await params; const body = await request.json(); if (admin.id === id && body.role === 'PETUGAS') return NextResponse.json({ error: 'Akun admin yang sedang digunakan tidak dapat diubah menjadi petugas.' }, { status: 400 }); const parsed = userSchema.partial().safeParse(body); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 }); const { password, ...data } = parsed.data; const user = await prisma.user.update({ where: { id }, data: { ...data, ...(password ? { password: await hash(password, 12) } : {}) }, select: { id: true, name: true, email: true, role: true } }); return NextResponse.json({ user }); }
  catch (error) { return errorResponse(error); }
}
export async function DELETE(_request: Request, { params }: Context) {
  try { const admin = await requireAdmin(); const { id } = await params; if (admin.id === id) return NextResponse.json({ error: 'Akun yang sedang digunakan tidak dapat dihapus.' }, { status: 400 }); await prisma.user.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
