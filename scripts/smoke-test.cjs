const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { inflateRawSync } = require('node:zlib');

const root = path.resolve(__dirname, '..');
const port = 3187;
const base = `http://127.0.0.1:${port}`;
const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const server = spawn(process.execPath, [nextCli, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'ignore' });
let adminCookie = '';
let officerCookie = '';
let categoryId = '';
let activityId = '';
let filePath = '';
let testUserId = '';
let checks = 0;

function zipEntries(buffer) {
  const entries = new Map(); let offset = 0;
  while (offset + 30 < buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 8); const compressedSize = buffer.readUInt32LE(offset + 18); const nameLength = buffer.readUInt16LE(offset + 26); const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30; const dataStart = nameStart + nameLength + extraLength; const name = buffer.toString('utf8', nameStart, nameStart + nameLength); const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, method === 8 ? inflateRawSync(compressed).toString('utf8') : compressed.toString('utf8'));
    offset = dataStart + compressedSize;
  }
  return entries;
}

function check(condition, message) { assert.ok(condition, message); checks++; }
async function request(route, options = {}, cookie = '') {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set('Cookie', cookie);
  return fetch(`${base}${route}`, { ...options, headers, redirect: options.redirect || 'follow' });
}
async function payload(response) { return response.json(); }
async function login(email, password) {
  const response = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const cookie = response.headers.get('set-cookie')?.match(/dprd_session=[^;]+/)?.[0] || '';
  return { response, data: await payload(response), cookie };
}
async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Next.js exited during startup (${server.exitCode}).`);
    try { const response = await fetch(`${base}/login`); if (response.ok) return; } catch { /* retry while the server starts */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Next.js did not start within 20 seconds.');
}
function activityForm(category, title, date, photos = []) {
  const body = new FormData();
  body.append('title', title); body.append('categoryId', category); body.append('activityDate', date); body.append('activityTime', '10:30');
  body.append('location', 'Ruang Uji DPRD'); body.append('description', 'Catatan kegiatan untuk pengujian sistem.'); body.append('notes', 'Uji otomatis sementara.');
  for (const file of photos) body.append('photos', new Blob([file.bytes], { type: file.type }), file.name);
  return body;
}

async function main() {
  await waitForServer();
  const protectedPage = await request('/dashboard', { redirect: 'manual' });
  check(protectedPage.status === 307 && protectedPage.headers.get('location')?.includes('/login'), `Halaman dashboard harus mengarahkan pengguna anonim ke login (status ${protectedPage.status}, lokasi ${protectedPage.headers.get('location') || 'kosong'}).`);
  const anonymousApi = await request('/api/activities');
  check(anonymousApi.status === 401, 'API kegiatan harus menolak pengguna anonim.');

  const badLogin = await login('admin@banjarbarukota.go.id', 'bukan-kata-sandi');
  check(badLogin.response.status === 401, 'Login dengan kata sandi keliru harus ditolak.');
  const admin = await login('admin@banjarbarukota.go.id', 'AdminDprd2026!');
  check(admin.response.ok && admin.cookie, 'Login admin harus membuat sesi HttpOnly.'); adminCookie = admin.cookie;
  const officer = await login('petugas@banjarbarukota.go.id', 'PetugasDprd2026!');
  check(officer.response.ok && officer.cookie, 'Login petugas harus berhasil.'); officerCookie = officer.cookie;

  const categoryCreate = await request('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Smoke ${Date.now()}`, description: 'Kategori sementara pengujian.' }) }, adminCookie);
  const categoryData = await payload(categoryCreate); check(categoryCreate.status === 201, 'Admin dapat membuat kategori.');
  categoryId = categoryData.category.id;
  const categoryUpdate = await request(`/api/categories/${categoryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${categoryData.category.name} Updated`, description: 'Kategori sementara diperbarui.' }) }, adminCookie);
  check(categoryUpdate.ok, 'Admin dapat mengubah kategori.');
  const category = (await payload(categoryUpdate)).category;
  const forbiddenCategory = await request('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Kategori Terlarang', description: '' }) }, officerCookie);
  check(forbiddenCategory.status === 403, 'Petugas tidak boleh membuat kategori.');
  const forbiddenUser = await request('/api/users', { method: 'GET' }, officerCookie);
  check(forbiddenUser.status === 403, 'Petugas tidak boleh mengelola akun pengguna.');

  const stamp = Date.now(); const title = `Smoke Test ${stamp}`; const today = new Date().toISOString().slice(0, 10);
  const image = await readFile(path.join(root, 'storage', 'uploads', 'contoh-dokumentasi-1.png'));
  const invalidUpload = await request('/api/activities', { method: 'POST', body: activityForm(category.id, title, today, [{ name: 'bukan-gambar.txt', type: 'text/plain', bytes: Buffer.from('bukan gambar') }]) }, officerCookie);
  check(invalidUpload.status === 400, 'Format unggahan yang tidak diizinkan ditolak.');
  const created = await request('/api/activities', { method: 'POST', body: activityForm(category.id, title, today, [{ name: 'uji-smoke.png', type: 'image/png', bytes: image }]) }, officerCookie);
  const createdData = await payload(created); check(created.status === 201, 'Petugas dapat membuat kegiatan dengan beberapa bagian form dan foto.');
  activityId = createdData.activity.id; filePath = createdData.activity.documents[0]?.filePath;
  check(Boolean(filePath), 'Metadata foto tersimpan pada kegiatan.');

  const editedTitle = `${title} Diubah`;
  const edited = await request(`/api/activities/${activityId}`, { method: 'PATCH', body: activityForm(category.id, editedTitle, today) }, officerCookie);
  check(edited.status === 200 && (await payload(edited)).activity.title === editedTitle, 'Petugas dapat mengubah kegiatan.');
  const search = await payload(await request(`/api/activities?q=${encodeURIComponent('Smoke Test')}&categoryId=${category.id}&from=${today}&to=${today}&sort=oldest`, {}, officerCookie));
  check(search.total === 1 && search.activities[0].id === activityId, 'Pencarian SQLite, kategori, tanggal, dan sorting menemukan data uji.');
  check((await request('/api/activities?from=2026-02-31', {}, officerCookie)).status === 400, 'Filter tanggal invalid ditolak.');
  const gallery = await payload(await request(`/api/gallery?categoryId=${category.id}&from=${today}&to=${today}`, {}, officerCookie));
  check(gallery.documents.some((item) => item.filePath === filePath), 'Galeri mengembalikan foto dengan filter kategori dan tanggal.');
  const report = await payload(await request(`/api/reports?categoryId=${category.id}&from=${today}&to=${today}`, {}, officerCookie));
  check(report.activities.some((item) => item.id === activityId) && report.summary.documents >= 1, 'Laporan merekap kegiatan dan foto.');
  const download = await request(`/api/files/${encodeURIComponent(filePath)}`, {}, officerCookie);
  check(download.ok && (await download.arrayBuffer()).byteLength === image.length, 'Foto dapat diunduh melalui endpoint terproteksi.');
  const workbook = await request(`/api/reports/export?categoryId=${category.id}&from=${today}&to=${today}`, {}, officerCookie);
  const workbookBytes = Buffer.from(await workbook.arrayBuffer());
  check(workbook.ok && workbook.headers.get('content-type')?.includes('spreadsheetml.sheet') && workbookBytes.readUInt32LE(0) === 0x04034b50, 'Ekspor laporan menghasilkan file XLSX valid berbentuk ZIP.');
  const entries = zipEntries(workbookBytes);
  check(entries.has('xl/worksheets/sheet1.xml') && entries.get('xl/worksheets/sheet1.xml').includes(editedTitle), 'Worksheet XLSX memuat kegiatan yang dipilih.');
  const forbiddenDelete = await request(`/api/activities/${activityId}`, { method: 'DELETE' }, officerCookie);
  check(forbiddenDelete.status === 403, 'Petugas tidak boleh menghapus kegiatan.');

  const userCreate = await request('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Akun Uji Smoke', email: `smoke-${stamp}@example.test`, password: 'SmokeTest2026!', role: 'PETUGAS' }) }, adminCookie);
  const userData = await payload(userCreate); check(userCreate.status === 201, 'Admin dapat membuat akun pengguna.'); testUserId = userData.user.id;
  const userUpdate = await request(`/api/users/${testUserId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Akun Uji Diperbarui', role: 'ADMIN' }) }, adminCookie);
  check(userUpdate.ok && (await payload(userUpdate)).user.role === 'ADMIN', 'Admin dapat mengubah pengguna dan role.');

  const deleted = await request(`/api/activities/${activityId}`, { method: 'DELETE' }, adminCookie);
  check(deleted.ok, 'Admin dapat menghapus kegiatan.'); activityId = '';
  const fileGone = await request(`/api/files/${encodeURIComponent(filePath)}`, {}, adminCookie);
  check(fileGone.status === 404, 'Berkas foto ikut dibersihkan setelah kegiatan dihapus.');
  const categoryDelete = await request(`/api/categories/${categoryId}`, { method: 'DELETE' }, adminCookie);
  check(categoryDelete.ok, 'Admin dapat menghapus kategori kosong.'); categoryId = '';
  const userDelete = await request(`/api/users/${testUserId}`, { method: 'DELETE' }, adminCookie);
  check(userDelete.ok, 'Admin dapat menghapus pengguna.'); testUserId = '';
  const logout = await request('/api/auth/logout', { method: 'POST' }, adminCookie);
  check(logout.ok, 'Logout berhasil.'); adminCookie = '';
  check((await request('/api/activities')).status === 401, 'Sesi yang telah dikeluarkan tidak lagi mengakses API.');
  console.log(`Smoke test lulus: ${checks} pemeriksaan API, role, pencarian, foto, laporan, dan XLSX.`);
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  if (adminCookie && activityId) await request(`/api/activities/${activityId}`, { method: 'DELETE' }, adminCookie).catch(() => undefined);
  if (adminCookie && testUserId) await request(`/api/users/${testUserId}`, { method: 'DELETE' }, adminCookie).catch(() => undefined);
  if (adminCookie && categoryId) await request(`/api/categories/${categoryId}`, { method: 'DELETE' }, adminCookie).catch(() => undefined);
  if (server.exitCode === null) server.kill();
});
