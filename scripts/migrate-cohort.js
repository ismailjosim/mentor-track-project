/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'student-management';
  if (!uri) {
    console.error('No MONGODB_URI found in env');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });
  console.log('Connected to MongoDB');

  const studentsColl = mongoose.connection.collection('students');

  // Assign cohort: '13' to all students currently in DB
  const result = await studentsColl.updateMany(
    {
      $or: [
        { cohort: { $exists: false } },
        { cohort: null },
        { cohort: '' },
      ],
    },
    { $set: { cohort: '13' } }
  );
  console.log('Updated students missing cohort:', result.modifiedCount);

  const total13 = await studentsColl.countDocuments({ cohort: '13' });
  console.log('Total students in Batch 13 now:', total13);

  // Check unique index on ownerId and email
  const indexes = await studentsColl.indexes();
  console.log('Existing indexes:', indexes.map((i) => ({ name: i.name, key: i.key, unique: i.unique })));

  const ownerEmailIdx = indexes.find((i) => i.name === 'ownerId_1_email_1');
  if (ownerEmailIdx && ownerEmailIdx.unique) {
    console.log('Dropping unique index ownerId_1_email_1 to allow per-cohort scoping...');
    try {
      await studentsColl.dropIndex('ownerId_1_email_1');
      console.log('Dropped ownerId_1_email_1');
    } catch (e) {
      console.warn('Could not drop index ownerId_1_email_1:', e.message);
    }
  }

  // Also check if email_1 is unique
  const emailIdx = indexes.find((i) => i.name === 'email_1');
  if (emailIdx && emailIdx.unique) {
    console.log('Dropping unique index email_1...');
    try {
      await studentsColl.dropIndex('email_1');
      console.log('Dropped email_1');
    } catch (e) {
      console.warn('Could not drop index email_1:', e.message);
    }
  }

  // Create compound unique index for ownerId + cohort + email
  await studentsColl.createIndex(
    { ownerId: 1, cohort: 1, email: 1 },
    { unique: true, name: 'ownerId_1_cohort_1_email_1' }
  );
  console.log('Created unique index ownerId_1_cohort_1_email_1');

  // Also create index for ownerId + cohort
  await studentsColl.createIndex(
    { ownerId: 1, cohort: 1 },
    { name: 'ownerId_1_cohort_1' }
  );
  console.log('Created index ownerId_1_cohort_1');

  await mongoose.disconnect();
  console.log('Migration complete!');
}

migrate().catch(console.error);
