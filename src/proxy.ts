import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-change-this-secret-before-deploying');
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('dprd_session')?.value;
  if (token) {
    try { await jwtVerify(token, secret); return NextResponse.next(); } catch { /* invalid or expired */ }
  }
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Silakan masuk untuk melanjutkan.' }, { status: 401 });
  const login = new URL('/login', request.url);
  login.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(login);
}
export const config = { matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'] };
