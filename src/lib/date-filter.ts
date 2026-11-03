export function getDateRange(params: URLSearchParams) {
  const parse = (value: string | null) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('INVALID_DATE_FILTER');
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('INVALID_DATE_FILTER');
    return date;
  };
  const from = parse(params.get('from')); const to = parse(params.get('to'));
  if (from && to && from > to) throw new Error('INVALID_DATE_FILTER');
  return from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: new Date(to.getTime() + 86_399_999) } : {}) } : undefined;
}
