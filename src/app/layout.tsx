import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = { title: 'Dokumentasi Kegiatan DPRD Banjarbaru', description: 'Sistem Informasi Dokumentasi Kegiatan DPRD Kota Banjarbaru' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body><AppShell>{children}</AppShell><Toaster position="top-right" richColors /></body></html>;
}
