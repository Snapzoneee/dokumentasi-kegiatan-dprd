import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/lib/validation';
import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data masuk tidak valid.' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await compare(parsed.data.password, user.password))) return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai.' }, { status: 401 });
    if (user.role !== 'ADMIN' && user.role !== 'PETUGAS') return NextResponse.json({ error: 'Akun belum memiliki peran yang valid.' }, { status: 403 });
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { console.error(error); return NextResponse.json({ error: 'Tidak dapat memproses login.' }, { status: 500 }); }
}
