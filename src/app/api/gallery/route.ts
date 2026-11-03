import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getDateRange } from '@/lib/date-filter';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireSession(); const params = new URL(request.url).searchParams; const q = params.get('q')?.trim(); const categoryId = params.get('categoryId'); const activityDate = getDateRange(params);
    const page = Math.max(1, Number(params.get('page')) || 1); const limit = Math.min(60, Math.max(1, Number(params.get('limit')) || 24));
    const activity: any = {}; if (categoryId) activity.categoryId = categoryId; if (activityDate) activity.activityDate = activityDate;
    if (q) activity.OR = [{ title: { contains: q } }, { location: { contains: q } }, { description: { contains: q } }, { category: { name: { contains: q } } }];
    const where: any = Object.keys(activity).length ? { activity } : {};
    const [documents, total, totalActivities, totalFiles] = await Promise.all([
      prisma.documentation.findMany({ where, orderBy: { activity: { activityDate: 'desc' } }, skip: (page - 1) * limit, take: limit, include: { activity: { include: { category: true } } } }),
      prisma.documentation.count({ where }), prisma.activity.count({ where: activity }), prisma.documentation.count()
    ]);
    return NextResponse.json({ documents, total, totalActivities, totalFiles, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { return errorResponse(error); }
}
