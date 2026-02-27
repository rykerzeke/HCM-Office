import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function run() {
  // We'll read both files and update/create officials
  const mpsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/mps.json'), 'utf-8'));
  const ministersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/ministers.json'), 'utf-8'));

  console.log('Importing MPs...');
  for (const mp of mpsData) {
    let state = await prisma.state.findFirst({ where: { name: mp.state } });
    if (!state) state = await prisma.state.create({ data: { name: mp.state } });

    let district = await prisma.district.findFirst({ where: { name: mp.constituency, stateId: state.id } });
    if (!district) district = await prisma.district.create({ data: { name: mp.constituency, stateId: state.id } });

    const existing = await prisma.official.findFirst({ where: { name: mp.mpName, designation: 'MP' } });
    
    const payload = {
        name: mp.mpName,
        designation: 'MP',
        department: 'Parliament',
        contact: mp.mobile1 + (mp.mobile2 && mp.mobile2 !== '—' && mp.mobile2 !== '' ? ' / ' + mp.mobile2 : ''),
        address: mp.delhiAddress,
        email: mp.email !== '—' ? mp.email : null,
        psName: mp.paName !== '—' ? mp.paName : null,
        districtId: district.id,
        stateId: state.id
    };

    if (existing) {
        await prisma.official.update({ where: { id: existing.id }, data: payload });
    } else {
        await prisma.official.create({ data: payload });
    }
  }

  console.log('Importing Ministers...');
  const allMinisters = [
    ...ministersData.cabinet_ministers,
    ...ministersData.ministers_of_state_independent_charge,
    ...ministersData.ministers_of_state
  ];

  for (const min of allMinisters) {
    // Determine contact string
    let psStr = min.ps;
    if (Array.isArray(psStr)) {
        psStr = psStr.join(', ');
    }
    
    const existing = await prisma.official.findFirst({ where: { name: min.name, designation: min.rank } });
    
    const payload = {
        name: min.name,
        designation: min.rank,
        department: min.ministry,
        contact: min.contact,
        psName: psStr
    };

    if (existing) {
        await prisma.official.update({ where: { id: existing.id }, data: payload });
    } else {
        await prisma.official.create({ data: payload });
    }
  }

  console.log('Completed importing KIs.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
