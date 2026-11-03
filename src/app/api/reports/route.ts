import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getDateRange } from '@/lib/date-filter';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireSession(); const params = new URL(request.url).searchParams; const categoryId = params.get('categoryId'); const activityDate = getDateRange(params);
    const where: any = {}; if (categoryId) where.categoryId = categoryId; if (activityDate) where.activityDate = activityDate;
    const activities = await prisma.activity.findMany({ where, orderBy: { activityDate: 'desc' }, include: { category: true, _count: { select: { documents: true } } } });
    return NextResponse.json({ activities, summary: { activities: activities.length, documents: activities.reduce((sum, item) => sum + item._count.documents, 0) } });
  } catch (error) { return errorResponse(error); }
}
