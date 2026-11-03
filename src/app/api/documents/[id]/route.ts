import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { removeUpload } from '@/lib/uploads';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function DELETE(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { id } = await params; const document = await prisma.documentation.delete({ where: { id } }); await removeUpload(document.filePath); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
