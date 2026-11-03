import { NextResponse } from 'next/server';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await requireSession(); const now = new Date(); const monthStart = startOfMonth(now); const monthEnd = endOfMonth(now); const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const [totalActivities, totalDocuments, monthActivities, totalCategories, recent] = await Promise.all([
      prisma.activity.count(), prisma.documentation.count(), prisma.activity.count({ where: { activityDate: { gte: monthStart, lte: monthEnd } } }), prisma.category.count(),
      prisma.activity.findMany({ take: 5, orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }], include: { category: true, documents: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, filePath: true } }, _count: { select: { documents: true } } } })
    ]);
    const grouped = await prisma.activity.findMany({ where: { activityDate: { gte: sixMonthsAgo } }, select: { activityDate: true } });
    const counts = new Map<string, number>(); for (const item of grouped) { const key = format(item.activityDate, 'yyyy-MM'); counts.set(key, (counts.get(key) || 0) + 1); }
    const chart = Array.from({ length: 6 }, (_, index) => { const date = startOfMonth(subMonths(now, 5 - index)); const key = format(date, 'yyyy-MM'); return { bulan: format(date, 'MMM'), jumlah: counts.get(key) || 0 }; });
    return NextResponse.json({ stats: { totalActivities, totalDocuments, monthActivities, totalCategories }, chart, recent });
  } catch (error) { return errorResponse(error); }
}
