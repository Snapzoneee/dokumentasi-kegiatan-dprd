import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';

const maxBytes = 5 * 1024 * 1024;
const allowed: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const uploadDirectory = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './storage/uploads');

export async function saveUploads(files: globalThis.File[]) {
  const saved: { fileName: string; filePath: string; fileType: string; fileSize: number }[] = [];
  if (files.length > 30) throw new Error('Maksimal 30 foto dalam satu kali unggah.');
  try {
    for (const file of files) {
      if (!allowed[file.type]) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
      if (file.size < 1 || file.size > maxBytes) throw new Error('Ukuran setiap foto maksimal 5 MB.');
      const bytes = Buffer.from(await file.arrayBuffer());
      const signatureValid = file.type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 : file.type === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!signatureValid) throw new Error('Isi file tidak cocok dengan format gambar yang dipilih.');
      await mkdir(uploadDirectory, { recursive: true });
      const generatedName = `${randomUUID()}${allowed[file.type]}`;
      await writeFile(path.join(uploadDirectory, generatedName), bytes, { flag: 'wx' });
      saved.push({ fileName: file.name.slice(0, 200), filePath: generatedName, fileType: file.type, fileSize: file.size });
    }
    return saved;
  } catch (error) {
    await Promise.all(saved.map((item) => unlink(path.join(uploadDirectory, item.filePath)).catch(() => undefined)));
    throw error;
  }
}

export async function removeUpload(filePath: string) {
  if (path.basename(filePath) !== filePath) return;
  await unlink(path.join(uploadDirectory, filePath)).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
}

export function isImageFile(file: FormDataEntryValue): file is globalThis.File {
  return typeof file !== 'string' && file.size > 0;
}
