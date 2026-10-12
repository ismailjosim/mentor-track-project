// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '', {
    dbName: process.env.MONGODB_DB_NAME || 'student-management',
  });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(
    'Collections:',
    collections.map((c) => c.name)
  );
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments({});
    console.log(`Collection ${c.name}: count = ${count}`);
  }
  const sampleStudent = await db
    .collection('students')
    .findOne({ lastCompletedAssignment: { $ne: 'None' } });
  console.log('Sample student with lastCompletedAssignment:', sampleStudent);

  process.exit(0);
}

run().catch(console.error);
