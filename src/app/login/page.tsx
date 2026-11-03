'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, FileImage, Landmark, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email('Masukkan alamat email yang valid.'), password: z.string().min(1, 'Kata sandi wajib diisi.') });
type FormValues = z.infer<typeof schema>;
export default function LoginPage() {
  const router = useRouter(); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  async function submit(values: FormValues) {
    setBusy(true);
    try { const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Login gagal.'); const next = new URLSearchParams(window.location.search).get('next'); toast.success('Selamat datang kembali.'); router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Login gagal.'); } finally { setBusy(false); }
  }
  return <main className="login-screen">
    <section className="login-art"><div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative', zIndex: 1 }}><span className="brand-mark"><Landmark size={21} /></span><span style={{ font: '700 12px Manrope', letterSpacing: '.08em' }}>SEKRETARIAT DPRD BANJARBARU</span></div><h1>Dokumentasi kegiatan, tertata dan mudah ditemukan.</h1><p>Platform pengelolaan dokumentasi kegiatan DPRD Kota Banjarbaru yang aman, terpusat, dan dapat diakses oleh tim yang berwenang.</p><div style={{ display: 'flex', gap: 8, marginTop: 28, color: '#cadae9', fontSize: 11, position: 'relative', zIndex: 1 }}><ShieldCheck size={16} /> Akses terproteksi · Arsip tersimpan terpusat</div><div style={{ position: 'absolute', left: '7vw', bottom: 36, fontSize: 10, color: '#8ea3b8' }}>BAGIAN FASILITASI · KOTA BANJARBARU</div></section>
    <section className="login-form-side"><form className="login-form" onSubmit={handleSubmit(submit)}><div className="eyebrow" style={{ marginBottom: 12 }}>Portal Dokumentasi</div><h2>Masuk ke akun</h2><p>Gunakan akun yang terdaftar untuk mengelola dokumentasi.</p>
      <div className="field"><label htmlFor="email">Email</label><div style={{ position: 'relative' }}><Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#8192a3' }} /><input id="email" className="input" style={{ paddingLeft: 36 }} placeholder="nama@banjarbarukota.go.id" autoComplete="username" {...register('email')} /></div>{errors.email && <span className="error-text">{errors.email.message}</span>}</div>
      <div className="field"><label htmlFor="password">Kata sandi</label><div className="password-box"><LockKeyhole size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#8192a3' }} /><input id="password" type={visible ? 'text' : 'password'} className="input" style={{ paddingLeft: 36 }} placeholder="Masukkan kata sandi" autoComplete="current-password" {...register('password')} /><button type="button" onClick={() => setVisible(!visible)} className="password-toggle" aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <span className="error-text">{errors.password.message}</span>}</div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Memeriksa akun…' : 'Masuk'}</button><div style={{ fontSize: 10, textAlign: 'center', color: '#8a99a8', marginTop: 22 }}>Gunakan akun yang disediakan administrator.</div>
    </form></section>
  </main>;
}
