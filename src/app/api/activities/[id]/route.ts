import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireSession } from '@/lib/auth';
import { activitySchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
import { isImageFile, removeUpload, saveUploads } from '@/lib/uploads';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try { await requireSession(); const { id } = await params; const activity = await prisma.activity.findUnique({ where: { id }, include: { category: true, creator: { select: { name: true } }, documents: { orderBy: { createdAt: 'desc' } } } }); if (!activity) return NextResponse.json({ error: 'Kegiatan tidak ditemukan.' }, { status: 404 }); return NextResponse.json({ activity }); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, { params }: Context) {
  let saved: Awaited<ReturnType<typeof saveUploads>> = [];
  try {
    const user = await requireSession(); const { id } = await params; const form = await request.formData();
    const data = Object.fromEntries(['title','categoryId','activityDate','activityTime','location','description','notes'].map((key) => [key, form.get(key) || undefined]));
    const parsed = activitySchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data kegiatan tidak valid.' }, { status: 400 });
    const files = form.getAll('photos').filter(isImageFile);
    try { saved = await saveUploads(files); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menyimpan foto.' }, { status: 400 }); }
    const activity = await prisma.activity.update({ where: { id }, data: { ...parsed.data, documents: { create: saved } }, include: { category: true, documents: true } });
    return NextResponse.json({ activity });
  } catch (error) { await Promise.all(saved.map((file) => removeUpload(file.filePath).catch(() => undefined))); return errorResponse(error); }
}
export async function DELETE(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { id } = await params; const activity = await prisma.activity.findUnique({ where: { id }, include: { documents: true } }); if (!activity) return NextResponse.json({ error: 'Kegiatan tidak ditemukan.' }, { status: 404 }); await prisma.activity.delete({ where: { id } }); await Promise.all(activity.documents.map((document) => removeUpload(document.filePath))); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
