import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getDateRange } from '@/lib/date-filter';
import { createXlsx } from '@/lib/xlsx';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireSession(); const params = new URL(request.url).searchParams; const categoryId = params.get('categoryId'); const activityDate = getDateRange(params);
    const where: any = {}; if (categoryId) where.categoryId = categoryId; if (activityDate) where.activityDate = activityDate;
    const activities = await prisma.activity.findMany({ where, orderBy: { activityDate: 'desc' }, include: { category: true, _count: { select: { documents: true } } } });
    const rows: (string | number)[][] = [['No.', 'Nama Kegiatan', 'Kategori', 'Tanggal', 'Lokasi', 'Jumlah Foto']];
    activities.forEach((item, index) => rows.push([index + 1, item.title, item.category.name, item.activityDate.toISOString().slice(0, 10), item.location, item._count.documents]));
    const output = createXlsx(rows); const filename = `laporan-dokumentasi-${params.get('from') || 'semua'}-${params.get('to') || 'semua'}.xlsx`;
    return new NextResponse(output, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
