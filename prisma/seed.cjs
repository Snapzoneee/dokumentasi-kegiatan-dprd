const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const { mkdir, writeFile } = require('fs/promises');
const path = require('path');
const { deflateSync } = require('zlib');

const prisma = new PrismaClient();
function crc32(data) { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let i=0;i<8;i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const name=Buffer.from(type); const size=Buffer.alloc(4);size.writeUInt32BE(data.length);const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([size,name,data,checksum]); }
function demoPng() {
  const width=640,height=360;const raw=Buffer.alloc((width*3+1)*height);
  for(let y=0;y<height;y++){const row=y*(width*3+1);raw[row]=0;for(let x=0;x<width;x++){const t=y/270;const r=y>270?216:Math.round(207-24*t),g=y>270?224:Math.round(228-20*t),b=y>270?232:246;const k=row+1+x*3;raw[k]=r;raw[k+1]=g;raw[k+2]=b;}}
  const fill=(x0,y0,x1,y1,color)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=y*(width*3+1)+1+x*3;raw[k]=color[0];raw[k+1]=color[1];raw[k+2]=color[2];}};
  fill(65,188,148,273,[195,210,223]);fill(486,197,573,273,[196,210,223]);fill(181,150,459,273,[247,249,250]);
  for(let y=112;y<151;y++){const half=Math.floor((y-112)*2.15);fill(320-half,y,320+half,y+1,[245,248,250]);}
  fill(168,148,472,154,[61,101,143]);fill(190,270,450,280,[49,84,119]);fill(308,124,332,143,[65,107,150]);
  for(let x=202;x<445;x+=35){fill(x,170,x+10,262,[179,198,215]);fill(x-3,168,x+13,173,[86,124,160]);}
  for(let x=90;x<140;x+=18)fill(x,210,x+7,269,[127,161,190]);for(let x=502;x<560;x+=18)fill(x,219,x+7,270,[127,161,190]);
  fill(296,213,344,273,[69,106,142]);fill(302,220,338,273,[192,210,224]);fill(0,280,width,282,[128,152,171]);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}

async function main() {
  const adminPassword=await hash('AdminDprd2026!',12);const officerPassword=await hash('PetugasDprd2026!',12);
  const admin=await prisma.user.upsert({where:{email:'admin@banjarbarukota.go.id'},update:{},create:{name:'Administrator DPRD',email:'admin@banjarbarukota.go.id',password:adminPassword,role:'ADMIN'}});
  await prisma.user.upsert({where:{email:'petugas@banjarbarukota.go.id'},update:{},create:{name:'Petugas Dokumentasi',email:'petugas@banjarbarukota.go.id',password:officerPassword,role:'PETUGAS'}});
  const names=[['Rapat','Rapat paripurna, komisi, dan badan.'],['Kunjungan Kerja','Kunjungan kerja dalam dan luar daerah.'],['Kegiatan Anggota DPRD','Kegiatan kedewanan dan serap aspirasi.'],['Penerimaan Tamu','Kunjungan tamu dan audiensi.'],['Sosialisasi','Sosialisasi kebijakan dan peraturan.'],['Kegiatan Bagian Fasilitasi','Kegiatan yang diselenggarakan Bagian Fasilitasi.'],['Lainnya','Kegiatan dokumentasi lainnya.']];
  const categories=[];for(const[name,description]of names)categories.push(await prisma.category.upsert({where:{name},update:{},create:{name,description}}));
  const activities=[
    {title:'Rapat Paripurna DPRD Kota Banjarbaru',category:categories[0],months:0,location:'Ruang Rapat Paripurna DPRD',description:'Rapat paripurna membahas agenda dan penyelenggaraan pemerintahan daerah Kota Banjarbaru.'},
    {title:'Kunjungan Kerja Komisi ke Kecamatan',category:categories[1],months:1,location:'Kecamatan Cempaka',description:'Kunjungan kerja komisi untuk meninjau program pelayanan masyarakat dan berdialog dengan warga.'},
    {title:'Sosialisasi Peraturan Daerah',category:categories[4],months:2,location:'Aula Gawi Sabarataan',description:'Sosialisasi peraturan daerah kepada perangkat daerah dan masyarakat Kota Banjarbaru.'}
  ];
  const directory=path.resolve(process.cwd(),process.env.UPLOAD_DIR||'./storage/uploads');await mkdir(directory,{recursive:true});const png=demoPng();
  for(const[index,item]of activities.entries()){
    const date=new Date();date.setMonth(date.getMonth()-item.months);date.setDate(Math.max(1,date.getDate()-3));date.setHours(9,0,0,0);
    let activity=await prisma.activity.findFirst({where:{title:item.title}});
    if(!activity)activity=await prisma.activity.create({data:{title:item.title,categoryId:item.category.id,activityDate:date,activityTime:'09:00',location:item.location,description:item.description,createdBy:admin.id}});
    const filePath=`contoh-dokumentasi-${index+1}.png`;const present=await prisma.documentation.findUnique({where:{filePath}});
    if(!present){await writeFile(path.join(directory,filePath),png);await prisma.documentation.create({data:{activityId:activity.id,fileName:`Dokumentasi contoh ${index+1}.png`,filePath,fileType:'image/png',fileSize:png.length}});}
  }
  console.log('Database siap. Akun demo dibuat jika belum ada.');
}
main().catch((error)=>{console.error(error);process.exit(1);}).finally(()=>prisma.$disconnect());
