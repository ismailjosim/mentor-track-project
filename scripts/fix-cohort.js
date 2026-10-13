/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  ['.env.local', '.env'].forEach((filename) => {
    const envPath = path.resolve(__dirname, '..', filename);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0 && !process.env[key.trim()]) {
            const val = vals
              .join('=')
              .trim()
              .replace(/^["']|["']$/g, '');
            process.env[key.trim()] = val;
          }
        }
      });
    }
  });
}

loadEnv();

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'student-management';
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName });
  console.log('Connected to MongoDB');

  const studentsColl = mongoose.connection.collection('students');

  // Check all students in 'Batch 14'
  const batch14Students = await studentsColl
    .find({
      cohort: { $in: ['Batch 14', 'batch 14', 'Batch Batch 14'] },
    })
    .toArray();

  console.log(`Found ${batch14Students.length} students with cohort 'Batch 14'`);

  for (const s of batch14Students) {
    const duplicateIn14 = await studentsColl.findOne({
      _id: { $ne: s._id },
      cohort: '14',
      email: s.email,
      ownerId: s.ownerId,
    });

    if (duplicateIn14) {
      console.log(
        `Student ${s.email} already exists in cohort 14 (id: ${duplicateIn14._id}). Removing duplicate.`
      );
      await studentsColl.deleteOne({ _id: s._id });
    } else {
      console.log(`Updating student ${s.name} (${s.email}) cohort from '${s.cohort}' to '14'...`);
      await studentsColl.updateOne(
        { _id: s._id },
        { $set: { cohort: '14', updatedAt: new Date() } }
      );
    }
  }

  // Also check if any other student has 'Batch ' in their cohort string
  const otherBatches = await studentsColl
    .find({
      cohort: { $regex: /^batch\s+/i },
    })
    .toArray();

  if (otherBatches.length > 0) {
    console.log(`Found ${otherBatches.length} other students with 'Batch ' prefix:`);
    for (const ob of otherBatches) {
      const cleanCohort = ob.cohort.replace(/^batch\s+/i, '').trim();
      console.log(`Cleaning student ${ob.email}: '${ob.cohort}' -> '${cleanCohort}'`);
      await studentsColl.updateOne(
        { _id: ob._id },
        { $set: { cohort: cleanCohort, updatedAt: new Date() } }
      );
    }
  }

  // Verify final cohorts in database
  const finalCohorts = await studentsColl.distinct('cohort');
  console.log('\n--- Final Database Status ---');
  console.log('Distinct cohorts:', finalCohorts);
  for (const c of finalCohorts) {
    const count = await studentsColl.countDocuments({ cohort: c });
    console.log(`Cohort "${c}": ${count} students`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(console.error);
