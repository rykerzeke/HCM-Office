import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function importMps() {
  const mpsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/mps.json'), 'utf-8'));
  
  for (const mp of mpsData) {
    // Upsert State
    let state = await prisma.state.findFirst({ where: { name: mp.state } });
    if (!state) {
        state = await prisma.state.create({ data: { name: mp.state } });
    }

    // Upsert District / Constituency
    let district = await prisma.district.findFirst({ where: { name: mp.constituency, stateId: state.id } });
    if (!district) {
        district = await prisma.district.create({ data: { name: mp.constituency, stateId: state.id } });
    }

    // Check if MP exists
    let official = await prisma.official.findFirst({ where: { name: mp.mpName, designation: 'MP' } });
    if (!official) {
        await prisma.official.create({
            data: {
                name: mp.mpName,
                designation: 'MP',
                department: 'Parliament',
                districtId: district.id,
                stateId: state.id
            }
        });
    }
  }
  console.log('Imported ' + mpsData.length + ' MPs');
}

importMps().catch(console.error).finally(() => prisma.$disconnect());
