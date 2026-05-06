require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { configureMongoDns } = require('../config/mongoDns');
const { seedHerbs } = require('./seedHerbs');
const { seedCenters } = require('./seedCenters');

async function autoSeed() {
  const herbs = await seedHerbs({ onlyIfEmpty: true });
  const centers = await seedCenters({ onlyIfEmpty: true });
  console.log(`Auto-seed herbs: ${herbs.skipped ? 'skipped' : 'seeded'} (${herbs.count})`);
  console.log(`Auto-seed centers: ${centers.skipped ? 'skipped' : 'seeded'} (${centers.count})`);
}

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to:', uri ? uri.substring(0, 30) + '...' : 'UNDEFINED - check .env');
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set. Check server/.env file exists.');
    process.exit(1);
  }
  configureMongoDns(uri);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas!');
  try {
    const herbs = await seedHerbs();
    console.log(`Seeded/upserted herbs: ${herbs.count}`);
    const centers = await seedCenters();
    console.log(`Seeded/upserted centers: ${centers.count}`);
  } finally {
    await mongoose.disconnect();
    console.log('Done!');
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = { autoSeed };
