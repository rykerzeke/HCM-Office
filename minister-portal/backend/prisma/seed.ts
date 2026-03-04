import 'dotenv/config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8']);
import { PrismaClient, RequestCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use DIRECT_URL (port 5432) — bypasses PgBouncer which blocks ts-node connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // Clear existing
  await prisma.communicationLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.stakeholderMapping.deleteMany();
  await prisma.case.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.official.deleteMany();
  await prisma.district.deleteMany();
  await prisma.state.deleteMany();
  await prisma.categoryDepartment.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@portal.gov', password, role: 'ADMIN' }
  });

  const staff = await prisma.user.create({
    data: { name: 'Staff User', email: 'staff@portal.gov', password, role: 'STAFF' }
  });

  // Create States - All 28 States + 8 Union Territories of India
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];
  const stateRecords = [];

  for (const s of states) {
    stateRecords.push(await prisma.state.create({ data: { name: s } }));
  }

  // Category → department mapping (for suggested authority)
  const categoryDepts = [
    { category: RequestCategory.CIVIC_ISSUE, departmentKeyword: 'Municipal', description: 'Roads, sanitation, civic' },
    { category: RequestCategory.PENSION_AND_WELFARE, departmentKeyword: 'Social Welfare', description: 'Pension, welfare' },
    { category: RequestCategory.LAND_AND_REVENUE, departmentKeyword: 'Revenue', description: 'Land, revenue' },
    { category: RequestCategory.LAND_AND_REVENUE, departmentKeyword: 'District Magistrate', description: 'DM office' },
    { category: RequestCategory.PUBLIC_GRIEVANCE, departmentKeyword: 'General Administration', description: 'General' },
    { category: RequestCategory.POLICY_REQUEST, departmentKeyword: 'General Administration', description: 'Policy' },
    { category: RequestCategory.PERSONAL_ISSUE, departmentKeyword: 'General Administration', description: 'Personal' },
    { category: RequestCategory.OTHER, departmentKeyword: 'General Administration', description: 'Other' },
  ];
  for (const cd of categoryDepts) {
    await prisma.categoryDepartment.create({ data: cd });
  }

  // Create Districts - Full lists for major states; key districts for others
  const districtsMap: Record<string, string[]> = {
    'Andhra Pradesh': [
      'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kadapa', 'Krishna',
      'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam',
      'Vizianagaram', 'West Godavari', 'Anakapalli', 'Annamayya', 'Bapatla',
      'Dr. B. R. Ambedkar Konaseema', 'Eluru', 'Kakinada', 'Nandyal',
      'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Sri Sathya Sai',
      'Sri Potti Sriramulu Nellore', 'Tirupati',
    ],
    'Arunachal Pradesh': [
      'Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey',
      'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'West Siang',
      'East Siang', 'Siang', 'Upper Siang', 'Lower Siang', 'Lower Dibang Valley',
      'Dibang Valley', 'Anjaw', 'Lohit', 'Namsai', 'Changlang', 'Tirap',
      'Longding', 'Pakke-Kessang', 'Leparada', 'Shi Yomi', 'Kamle',
    ],
    'Assam': [
      'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo',
      'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao',
      'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup',
      'Kamrup Metropolitan', 'Karbi Anglong', 'West Karbi Anglong', 'Karimganj',
      'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari',
      'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia',
      'Udalguri', 'Bajali', 'Tamulpur',
    ],
    'Bihar': [
      'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur',
      'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj',
      'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
      'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
      'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa',
      'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan',
      'Supaul', 'Vaishali', 'West Champaran',
    ],
    'Delhi': [
      'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi',
      'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi',
      'South East Delhi', 'South West Delhi', 'West Delhi',
    ],
    'Gujarat': [
      'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
      'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka',
      'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch',
      'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
      'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
      'Tapi', 'Vadodara', 'Valsad',
    ],
    'Haryana': [
      'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram',
      'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh',
      'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa',
      'Sonipat', 'Yamunanagar',
    ],
    'Karnataka': [
      'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
      'Bidar', 'Chamarajanagar', 'Chikballapur', 'Chikkamagaluru', 'Chitradurga',
      'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
      'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur',
      'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada',
      'Vijayapura', 'Yadgir', 'Vijayanagara',
    ],
    'Maharashtra': [
      'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
      'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
      'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban',
      'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
      'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg',
      'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
    ],
    'Rajasthan': [
      'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara',
      'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur',
      'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu',
      'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand',
      'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur',
    ],
    'Tamil Nadu': [
      'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
      'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
      'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
      'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
      'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur',
      'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur',
      'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
      'Viluppuram', 'Virudhunagar',
    ],
    'Uttar Pradesh': [
      'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya',
      'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda',
      'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr',
      'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad',
      'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur',
      'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun',
      'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar',
      'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar', 'Lalitpur', 'Lucknow',
      'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut',
      'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh',
      'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal',
      'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar',
      'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi',
    ],
    // Other states/UTs – key districts
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Korba', 'Rajnandgaon'],
    'Goa': ['North Goa', 'South Goa'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
    'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
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
