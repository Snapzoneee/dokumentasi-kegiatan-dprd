import { NextResponse } from 'next/server';

export function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'INVALID_DATE_FILTER') return NextResponse.json({ error: 'Rentang tanggal tidak valid.' }, { status: 400 });
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Silakan masuk untuk melanjutkan.' }, { status: 401 });
  if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Anda tidak memiliki akses untuk tindakan ini.' }, { status: 403 });
  if (error instanceof Error && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'Data dengan nilai tersebut sudah ada.' }, { status: 409 });
  if (error instanceof Error && 'code' in error && error.code === 'P2003') return NextResponse.json({ error: 'Data masih digunakan dan tidak dapat dihapus.' }, { status: 409 });
  console.error(error);
  return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
}

export function badRequest(message: string) { return NextResponse.json({ error: message }, { status: 400 }); }
