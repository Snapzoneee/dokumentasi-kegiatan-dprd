import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: Date | string, pattern = 'd MMM yyyy') { return format(new Date(date), pattern, { locale: id }); }
export function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
