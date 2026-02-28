import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

async function main() {
  const existing = await prisma.state.findMany();
  const existingNames = new Set(existing.map(s => s.name));
  
  const toAdd = states.filter(s => !existingNames.has(s));
  
  if (toAdd.length === 0) {
    console.log('All states already exist.');
    return;
  }
  
  for (const s of toAdd) {
    await prisma.state.create({ data: { name: s } });
  }
  console.log(`Added ${toAdd.length} missing states.`);
}

main().finally(() => prisma.$disconnect());
