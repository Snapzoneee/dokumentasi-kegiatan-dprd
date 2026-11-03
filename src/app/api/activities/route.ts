import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { activitySchema } from '@/lib/validation';
import { errorResponse } from '@/lib/http';
import { isImageFile, removeUpload, saveUploads } from '@/lib/uploads';
import { getDateRange } from '@/lib/date-filter';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireSession();
    const params = new URL(request.url).searchParams;
    const q = params.get('q')?.trim(); const categoryId = params.get('categoryId'); const activityDate = getDateRange(params);
    const sort = params.get('sort') === 'oldest' ? 'asc' : 'desc'; const page = Math.max(1, Number(params.get('page')) || 1); const limit = Math.min(60, Math.max(1, Number(params.get('limit')) || 12));
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (activityDate) where.activityDate = activityDate;
    if (q) where.OR = [{ title: { contains: q } }, { location: { contains: q } }, { description: { contains: q } }, { notes: { contains: q } }, { category: { name: { contains: q } } }];
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({ where, orderBy: { activityDate: sort }, skip: (page - 1) * limit, take: limit, include: { category: true, creator: { select: { name: true } }, documents: { orderBy: { createdAt: 'desc' }, take: 4 }, _count: { select: { documents: true } } } }),
      prisma.activity.count({ where })
    ]);
    return NextResponse.json({ activities, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  let saved: Awaited<ReturnType<typeof saveUploads>> = [];
  try {
    const user = await requireSession(); const form = await request.formData();
    const data = Object.fromEntries(['title','categoryId','activityDate','activityTime','location','description','notes'].map((key) => [key, form.get(key) || undefined]));
    const parsed = activitySchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data kegiatan tidak valid.' }, { status: 400 });
    const files = form.getAll('photos').filter(isImageFile);
    try { saved = await saveUploads(files); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menyimpan foto.' }, { status: 400 }); }
    const activity = await prisma.activity.create({ data: { ...parsed.data, createdBy: user.id, documents: { create: saved } }, include: { category: true, documents: true } });
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) { await Promise.all(saved.map((file) => removeUpload(file.filePath).catch(() => undefined))); return errorResponse(error); }
}
