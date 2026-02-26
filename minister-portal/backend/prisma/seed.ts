import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.stakeholderMapping.deleteMany();
  await prisma.case.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.official.deleteMany();
  await prisma.district.deleteMany();
  await prisma.state.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@portal.gov', password, role: 'ADMIN' }
  });
  
  const staff = await prisma.user.create({
    data: { name: 'Staff User', email: 'staff@portal.gov', password, role: 'STAFF' }
  });

  // Create States
  const states = ['Maharashtra', 'Gujarat', 'Delhi', 'Karnataka', 'Tamil Nadu'];
  const stateRecords = [];
  
  for (const s of states) {
    stateRecords.push(await prisma.state.create({ data: { name: s } }));
  }

  // Create Districts
  const districtsMap: any = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai']
  };

  const districtRecords = [];
  for (const state of stateRecords) {
    const stateDistricts = districtsMap[state.name];
    for (const d of stateDistricts) {
      districtRecords.push(await prisma.district.create({
        data: { name: d, stateId: state.id }
      }));
    }
  }

  // Create Officials
  const designations = ['District Magistrate', 'Superintendent of Police', 'MLA', 'MP', 'Commissioner'];
  for (const district of districtRecords) {
    await prisma.official.create({
      data: {
        name: `Official of ${district.name}`,
        designation: designations[Math.floor(Math.random() * designations.length)],
        department: 'General Administration',
        districtId: district.id,
        stateId: district.stateId
      }
    });
  }

  console.log('Seeding completed successfully: ' + stateRecords.length + ' states, ' + districtRecords.length + ' districts.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
