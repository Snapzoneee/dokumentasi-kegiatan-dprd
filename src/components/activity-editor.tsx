'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CalendarDays, ImagePlus, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
type Category = { id: string; name: string };
type Initial = { id: string; title: string; categoryId: string; activityDate: string; activityTime?: string | null; location: string; description: string; notes?: string | null };
const schema = z.object({ title: z.string().trim().min(3, 'Nama kegiatan minimal 3 karakter.').max(180), categoryId: z.string().min(1, 'Pilih kategori kegiatan.'), activityDate: z.string().min(1, 'Tanggal wajib diisi.'), activityTime: z.string().optional(), location: z.string().trim().min(2, 'Lokasi wajib diisi.'), description: z.string().trim().min(3, 'Deskripsi wajib diisi.'), notes: z.string().optional() });
type Fields = z.infer<typeof schema>;
export function ActivityEditor({ initial }: { initial?: Initial }) {
  const router = useRouter(); const [categories, setCategories] = useState<Category[]>([]); const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false);
  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => { fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => toast.error('Gagal memuat kategori.')); }, []);
  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({ resolver: zodResolver(schema), defaultValues: initial ? { title: initial.title, categoryId: initial.categoryId, activityDate: initial.activityDate.slice(0,10), activityTime: initial.activityTime || '', location: initial.location, description: initial.description, notes: initial.notes || '' } : { activityDate: new Date().toISOString().slice(0,10) } });
  function chooseFiles(list: FileList | null) { if (!list) return; const next = Array.from(list); if (next.some((file) => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { toast.error('Pilih JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB per foto.'); return; } if (files.length + next.length > 30) { toast.error('Maksimal 30 foto per kegiatan.'); return; } setFiles((current) => [...current, ...next]); }
  async function submit(values: Fields) {
    if (!initial && !files.length) { toast.error('Tambahkan minimal satu foto dokumentasi.'); return; }
    setBusy(true); const body = new FormData(); Object.entries(values).forEach(([key, value]) => body.append(key, value || '')); files.forEach((file) => body.append('photos', file));
    try { const response = await fetch(initial ? `/api/activities/${initial.id}` : '/api/activities', { method: initial ? 'PATCH' : 'POST', body }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Gagal menyimpan kegiatan.'); toast.success(initial ? 'Perubahan kegiatan tersimpan.' : 'Kegiatan berhasil ditambahkan.'); router.push(`/kegiatan/${data.activity.id}`); router.refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal menyimpan kegiatan.'); } finally { setBusy(false); }
  }
  return <>
    <div className="page-heading"><div><div className="eyebrow">Data Kegiatan</div><h1>{initial ? 'Ubah Kegiatan' : 'Tambah Kegiatan'}</h1><p>Lengkapi informasi kegiatan dan unggah dokumentasi foto.</p></div><Link className="btn btn-secondary" href={initial ? `/kegiatan/${initial.id}` : '/kegiatan'}><ArrowLeft size={15} /> Kembali</Link></div>
    <form className="card form-card" onSubmit={handleSubmit(submit)}><div className="form-grid">
      <div className="field full"><label htmlFor="title">Nama kegiatan *</label><input id="title" className="input" placeholder="Contoh: Rapat Paripurna DPRD" {...register('title')} />{errors.title && <span className="error-text">{errors.title.message}</span>}</div>
      <div className="field"><label htmlFor="categoryId">Kategori *</label><select id="categoryId" className="select" {...register('categoryId')}><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <span className="error-text">{errors.categoryId.message}</span>}{categories.length === 0 && <small>Belum ada kategori. <Link href="/kategori" style={{ color: '#2563eb' }}>Kelola kategori</Link></small>}</div>
      <div className="field"><label htmlFor="activityDate">Tanggal kegiatan *</label><div style={{ position: 'relative' }}><CalendarDays size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#8192a3' }} /><input id="activityDate" type="date" className="input" style={{ paddingLeft: 36 }} {...register('activityDate')} /></div>{errors.activityDate && <span className="error-text">{errors.activityDate.message}</span>}</div>
      <div className="field"><label htmlFor="activityTime">Waktu</label><input id="activityTime" type="time" className="input" {...register('activityTime')} /></div>
      <div className="field"><label htmlFor="location">Lokasi *</label><div style={{ position: 'relative' }}><MapPin size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#8192a3' }} /><input id="location" className="input" style={{ paddingLeft: 36 }} placeholder="Lokasi kegiatan" {...register('location')} /></div>{errors.location && <span className="error-text">{errors.location.message}</span>}</div>
      <div className="field full"><label htmlFor="description">Deskripsi kegiatan *</label><textarea id="description" className="textarea" placeholder="Tuliskan ringkasan kegiatan…" {...register('description')} />{errors.description && <span className="error-text">{errors.description.message}</span>}</div>
      <div className="field full"><label htmlFor="notes">Keterangan tambahan</label><textarea id="notes" className="textarea" style={{ minHeight: 66 }} placeholder="Informasi tambahan (opsional)" {...register('notes')} /></div>
      <div className="field full"><label>Dokumentasi Foto {initial ? '(tambahkan foto)' : '*'}</label><label className="upload-zone" htmlFor="photos" style={{ display: 'block', cursor: 'pointer' }}><ImagePlus size={22} style={{ margin: '0 auto 7px', color: '#477ab4' }} /><strong style={{ display: 'block', color: '#334f6b', marginBottom: 4 }}>Klik untuk memilih foto</strong>Format JPG, PNG, WEBP · maksimal 5 MB per foto</label><input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { chooseFiles(e.target.files); e.currentTarget.value = ''; }} />
        {!!previews.length && <div className="preview-strip">{previews.map((item, index) => <div className="preview-item" key={`${item.name}-${index}`}><Image src={item.url} alt={item.name} width={74} height={66} unoptimized /><button type="button" aria-label="Hapus foto pilihan" className="preview-remove" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><X size={12} /></button></div>)}</div>}
      </div>
    </div><div className="form-actions"><Link className="btn btn-secondary" href={initial ? `/kegiatan/${initial.id}` : '/kegiatan'}>Batal</Link><button disabled={busy} className="btn btn-primary">{busy ? 'Menyimpan…' : initial ? 'Simpan Perubahan' : 'Simpan Kegiatan'}</button></div></form>
  </>;
}
