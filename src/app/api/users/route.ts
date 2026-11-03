import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { userSchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { await requireAdmin(); const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } }); return NextResponse.json({ users }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { await requireAdmin(); const parsed = userSchema.extend({ password: userSchema.shape.password.unwrap().min(8) }).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 }); const { password, ...data } = parsed.data; const user = await prisma.user.create({ data: { ...data, email: data.email.toLowerCase(), password: await hash(password, 12) }, select: { id: true, name: true, email: true, role: true } }); return NextResponse.json({ user }, { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
