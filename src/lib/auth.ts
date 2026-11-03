import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

export const COOKIE_NAME = 'dprd_session';
export type SessionUser = { id: string; name: string; email: string; role: 'ADMIN' | 'PETUGAS' };
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-change-this-secret-before-deploying');

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.id !== 'string' || typeof payload.name !== 'string' || typeof payload.email !== 'string' || (payload.role !== 'ADMIN' && payload.role !== 'PETUGAS')) return null;
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
  } catch { return null; }
}

export async function requireSession() {
  const user = await getSession();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin() {
  const user = await requireSession();
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return user;
}
