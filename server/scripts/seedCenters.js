const Center = require('../models/Center');

const cities = [
  ['AyurSutra Wellness Center - Mumbai', 'Mumbai', 'Maharashtra', '102 Heritage Building, Bandra West, Mumbai, Maharashtra 400050'],
  ['AyurSutra Panchakarma Clinic - Delhi', 'Delhi', 'Delhi', 'B-18 Green Park Main, New Delhi, Delhi 110016'],
  ['Lotus Ayurvedic Clinic - Bangalore', 'Bangalore', 'Karnataka', '45/A 100 Feet Road, Indiranagar, Bangalore, Karnataka 560038'],
  ['Kaveri Ayurveda Studio - Chennai', 'Chennai', 'Tamil Nadu', '18 Cathedral Road, Gopalapuram, Chennai, Tamil Nadu 600086'],
  ['Prana Panchakarma Hub - Hyderabad', 'Hyderabad', 'Telangana', 'Plot 21 Jubilee Hills Road 36, Hyderabad, Telangana 500033'],
  ['Soma Healing Center - Pune', 'Pune', 'Maharashtra', 'Lane 6, Koregaon Park, Pune, Maharashtra 411001'],
  ['Ganga Ayurveda House - Kolkata', 'Kolkata', 'West Bengal', '22 Ballygunge Circular Road, Kolkata, West Bengal 700019'],
  ['Niraamaya Ayurveda - Ahmedabad', 'Ahmedabad', 'Gujarat', 'Sindhu Bhavan Road, Bodakdev, Ahmedabad, Gujarat 380054'],
  ['Aravalli Wellness Clinic - Jaipur', 'Jaipur', 'Rajasthan', 'C-Scheme, Ashok Nagar, Jaipur, Rajasthan 302001'],
  ['Shanti Ayurveda Center - Chandigarh', 'Chandigarh', 'Chandigarh', 'SCO 41, Sector 8C, Chandigarh 160009'],
];

const images = [
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
];

const allTherapies = ['Shirodhara', 'Panchakarma', 'Abhyanga', 'Nasya', 'Basti', 'Udvartana', 'Swedana', 'Vamana', 'Virechana'];

function centerRecord([name, city, state, address], index) {
  return {
    name, city, state, address,
    phone: `+91 ${90000 + index * 137} ${45000 + index * 211}`,
    email: `${city.toLowerCase()}@ayursutra.com`,
    hours: index % 2 ? '09:00 AM - 07:00 PM' : '08:00 AM - 08:00 PM',
    specialties: index % 3 === 0 ? ['Panchakarma', 'Detox', 'Nadi Pariksha'] : index % 3 === 1 ? ['Shirodhara', 'Stress Care', 'Abhyanga'] : ['Skin Care', 'Weight Management', 'Respiratory Care'],
    rating: Number((4.4 + (index % 6) / 10).toFixed(1)),
    reviewCount: 82 + index * 37,
    imageUrl: images[index % images.length],
    therapiesOffered: allTherapies.slice(0, 5 + (index % 5)),
  };
}

async function seedCenters({ onlyIfEmpty = false } = {}) {
  if (onlyIfEmpty && await Center.countDocuments() > 0) return { skipped: true, count: await Center.countDocuments() };
  const records = cities.map(centerRecord);
  await Promise.all(records.map((center) => Center.updateOne({ name: center.name }, { $set: center }, { upsert: true, runValidators: true })));
  return { skipped: false, count: records.length };
}

module.exports = { seedCenters, centerSeedData: cities.map(centerRecord) };
