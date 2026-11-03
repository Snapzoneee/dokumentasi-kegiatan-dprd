'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Archive, BarChart3, Camera, ChevronRight, ClipboardList, FolderKanban, Grid2X2, Images, LogOut, Menu, Search, Settings2, Users, X } from 'lucide-react';
import { toast } from 'sonner';

type User = { id: string; name: string; email: string; role: 'ADMIN' | 'PETUGAS' };
const groups = [
  { label: 'Menu Utama', items: [
    { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
    { href: '/kegiatan', label: 'Data Kegiatan', icon: ClipboardList },
    { href: '/galeri', label: 'Galeri Dokumentasi', icon: Images },
    { href: '/pencarian', label: 'Pencarian', icon: Search }
  ] },
  { label: 'Pengelolaan', items: [
    { href: '/kategori', label: 'Kategori Kegiatan', icon: FolderKanban, admin: true },
    { href: '/laporan', label: 'Laporan', icon: BarChart3 },
    { href: '/pengguna', label: 'Manajemen Pengguna', icon: Users, admin: true }
  ] }
];
const pageTitles: Record<string, string> = { '/dashboard': 'Dashboard', '/kegiatan': 'Data Kegiatan', '/galeri': 'Galeri Dokumentasi', '/pencarian': 'Pencarian Dokumentasi', '/kategori': 'Kategori Kegiatan', '/laporan': 'Laporan Dokumentasi', '/pengguna': 'Manajemen Pengguna' };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [user, setUser] = useState<User | null>(null); const [open, setOpen] = useState(false);
  useEffect(() => { if (pathname === '/login') return; fetch('/api/auth/session').then((r) => r.ok ? r.json() : null).then((data) => setUser(data?.user || null)).catch(() => undefined); }, [pathname]);
  if (pathname === '/login') return <>{children}</>;
  const title = pageTitles[pathname] || (pathname.startsWith('/kegiatan/') ? pathname.endsWith('/edit') ? 'Ubah Kegiatan' : 'Detail Kegiatan' : 'Dokumentasi DPRD');
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); toast.success('Anda telah keluar.'); router.replace('/login'); }
  return <div className="app-shell">
    {open && <button aria-label="Tutup menu" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 25, background: '#102a4359', border: 0 }} />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link className="brand" href="/dashboard" onClick={() => setOpen(false)}>
        <Image src="/dprd-banjarbaru-emblem.png" alt="Lambang DPRD Kota Banjarbaru" width={46} height={44} priority className="brand-logo" />
        <span><strong style={{ display: 'block', font: '800 12px Manrope', letterSpacing: '.03em' }}>DOKUMENTASI DPRD</strong><small style={{ color: '#b6c6d6', fontSize: 9 }}>KOTA BANJARBARU</small></span>
      </Link>
      {groups.map((group) => <div key={group.label}>
        <div className="nav-label">{group.label}</div>
        {group.items.filter((item) => !item.admin || user?.role === 'ADMIN').map(({ href, label, icon: Icon }) => {
          const active = href === '/kegiatan' ? pathname === href || pathname.startsWith('/kegiatan/') : pathname === href;
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${active ? 'active' : ''}`}><Icon size={16} strokeWidth={1.9} /><span style={{ flex: 1 }}>{label}</span>{active && <ChevronRight size={13} opacity={.7} />}</Link>;
        })}
      </div>)}
      <div className="sidebar-footer"><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dce6ef', marginBottom: 6 }}><Camera size={13} /> Sekretariat DPRD</div>Fasilitasi · Banjarbaru</div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup menu' : 'Buka menu'}>{open ? <X size={17} /> : <Menu size={17} />}</button><div><div className="topbar-title">{title}</div><div style={{ color: '#8a99a8', fontSize: 10, marginTop: 3 }}>Sekretariat DPRD Kota Banjarbaru</div></div></div>
        <div className="topbar-actions"><Link href="/pencarian" aria-label="Cari dokumentasi" className="icon-btn"><Search size={16} /></Link><div className="user-chip"><div className="avatar">{user?.name?.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'DP'}</div><div className="user-copy"><strong style={{ display: 'block', fontSize: 11, color: '#30475e' }}>{user?.name || 'Pengguna'}</strong><span style={{ fontSize: 9, color: '#8291a0' }}>{user?.role === 'ADMIN' ? 'Administrator' : 'Petugas'}</span></div></div><button onClick={logout} aria-label="Keluar" title="Keluar" className="icon-btn"><LogOut size={15} /></button></div>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>;
}
