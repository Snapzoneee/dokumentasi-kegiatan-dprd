import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email('Masukkan alamat email yang valid.'), password: z.string().min(1, 'Kata sandi wajib diisi.') });
export const categorySchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).optional().nullable() });
export const activitySchema = z.object({
  title: z.string().trim().min(3).max(180), categoryId: z.string().min(1), activityDate: z.coerce.date(),
  activityTime: z.string().trim().max(20).optional().nullable(), location: z.string().trim().min(2).max(180),
  description: z.string().trim().min(3).max(4000), notes: z.string().trim().max(1000).optional().nullable()
});
export const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), role: z.enum(['ADMIN', 'PETUGAS']), password: z.string().min(8).optional() });
