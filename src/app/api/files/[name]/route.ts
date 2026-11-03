import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { uploadDirectory } from '@/lib/uploads';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ name: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    await requireSession();
    const { name } = await params;
    if (path.basename(name) !== name) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
    const record = await prisma.documentation.findUnique({ where: { filePath: name } });
    if (!record) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
    const bytes = await readFile(path.join(uploadDirectory, name));
    const inline = new URL(request.url).searchParams.get('inline') === '1';
    return new NextResponse(bytes, { headers: { 'Content-Type': record.fileType, 'Content-Length': String(bytes.length), 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(record.fileName)}`, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return errorResponse(error); }
}
