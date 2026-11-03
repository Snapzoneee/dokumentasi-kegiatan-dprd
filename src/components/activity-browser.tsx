'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileImage, MapPin, Plus, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
type Activity = { id: string; title: string; activityDate: string; location: string; category: { name: string }; documents: { filePath: string }[]; _count: { documents: number } };
type Category = { id: string; name: string };
export function ActivityBrowser({ searchMode = false }: { searchMode?: boolean }) {
  const [q,setQ] = useState(''); const [categoryId,setCategoryId] = useState(''); const [from,setFrom] = useState(''); const [to,setTo] = useState(''); const [sort,setSort] = useState('newest'); const [page,setPage] = useState(1);
  const [activities,setActivities] = useState<Activity[]>([]); const [categories,setCategories] = useState<Category[]>([]); const [total,setTotal] = useState(0); const [pages,setPages] = useState(1); const [loading,setLoading] = useState(true);
  useEffect(() => { fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => undefined); }, []);
  const load = useCallback(async () => { setLoading(true); const params = new URLSearchParams({ page: String(page), limit: '9', sort }); if (q.trim()) params.set('q',q.trim()); if (categoryId) params.set('categoryId',categoryId); if (from) params.set('from',from); if (to) params.set('to',to); try { const response = await fetch(`/api/activities?${params}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setActivities(data.activities || []); setTotal(data.total || 0); setPages(data.pages || 1); } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal memuat kegiatan.'); } finally { setLoading(false); } }, [page,q,categoryId,from,to,sort]);
  useEffect(() => { const timer = setTimeout(() => void load(), q ? 250 : 0); return () => clearTimeout(timer); }, [load,q]);
  function reset() { setQ('');setCategoryId('');setFrom('');setTo('');setSort('newest');setPage(1); }
  return <>
    <div className="page-heading"><div><div className="eyebrow">Arsip Kegiatan</div><h1>{searchMode ? 'Pencarian Dokumentasi' : 'Data Kegiatan'}</h1><p>{searchMode ? 'Temukan kegiatan melalui nama, lokasi, kategori, atau rentang tanggal.' : 'Kelola kegiatan dan dokumentasi foto Sekretariat DPRD.'}</p></div>{!searchMode && <Link href="/kegiatan/tambah" className="btn btn-primary"><Plus size={15} /> Tambah Kegiatan</Link>}</div>
    <div className="toolbar card"><div className="search-field"><Search size={16} /><input aria-label="Cari kegiatan" placeholder="Cari nama, lokasi, deskripsi…" value={q} onChange={(e) => { setQ(e.target.value);setPage(1); }} /></div>
      <select aria-label="Filter kategori" className="select" value={categoryId} onChange={(e) => {setCategoryId(e.target.value);setPage(1);}}><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input aria-label="Tanggal mulai" className="input" type="date" value={from} onChange={(e) => {setFrom(e.target.value);setPage(1);}} /><input aria-label="Tanggal selesai" className="input" type="date" value={to} onChange={(e) => {setTo(e.target.value);setPage(1);}} />
      <select aria-label="Urutkan" className="select" value={sort} onChange={(e) => {setSort(e.target.value);setPage(1);}}><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select><button aria-label="Reset filter" title="Reset filter" className="icon-btn" onClick={reset}><RotateCcw size={14} /></button>
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'0 2px 12px', color:'#75869a',fontSize:11 }}><span><SlidersHorizontal size={13} style={{verticalAlign:'middle',marginRight:5}} />{total} kegiatan ditemukan</span>{loading && <span>Memuat…</span>}</div>
    {loading ? <div className="activity-cards">{Array.from({length:6},(_,i)=><div key={i} className="card" style={{height:275,background:'linear-gradient(100deg,#fff,#f6f8fb,#fff)'}} />)}</div> : activities.length ? <div className="activity-cards">{activities.map((item) => <article className="card activity-card" key={item.id}>
      <Link href={`/kegiatan/${item.id}`} className="activity-cover">{item.documents[0] ? <Image src={`/api/files/${encodeURIComponent(item.documents[0].filePath)}?inline=1`} alt={item.title} fill sizes="(max-width:540px) 100vw, (max-width:1100px) 50vw, 33vw" /> : <span className="activity-cover-empty"><FileImage size={30} /></span>}<span className="badge" style={{position:'absolute',top:10,left:10}}>{item.category.name}</span></Link>
      <div className="activity-card-body"><h3><Link href={`/kegiatan/${item.id}`}>{item.title}</Link></h3><p><MapPin size={13}/>{item.location}</p><div className="card-meta"><span><CalendarDays size={12} style={{verticalAlign:'middle',marginRight:5}}/>{formatDate(item.activityDate)}</span><span><FileImage size={12} style={{verticalAlign:'middle',marginRight:4}}/>{item._count.documents} foto</span></div></div>
    </article>)}</div> : <div className="card empty-state"><div className="empty-icon"><FileImage size={22}/></div><h3>Belum ada kegiatan ditemukan</h3><p>Ubah kata kunci atau filter, atau tambahkan kegiatan baru.</p>{!searchMode && <Link className="btn btn-primary btn-small" href="/kegiatan/tambah"><Plus size={14}/> Tambah kegiatan</Link>}</div>}
    {pages > 1 && <div className="pagination"><button className="btn btn-secondary btn-small" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft size={14}/> Sebelumnya</button><span>Halaman {page} dari {pages}</span><button className="btn btn-secondary btn-small" disabled={page>=pages} onClick={()=>setPage(page+1)}>Berikutnya <ChevronRight size={14}/></button></div>}
  </>;
}
