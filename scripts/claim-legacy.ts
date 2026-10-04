/**
 * Ops Script: Claim Legacy Unowned Records
 * Run once to associate unowned records with an explicit ownerId.
 * Usage: node scripts/claim-legacy.js <ownerUserId>
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'MentorshipDB';

if (!uri) {
  console.error('❌ MONGODB_URI is not set in environment.');
  process.exit(1);
}

const targetOwnerId = process.argv[2];

if (!targetOwnerId) {
  console.error(
    '❌ Please provide a target owner userId: ts-node scripts/claim-legacy.ts <userId>'
  );
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`);

    const missingOwnerFilter = {
      $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: '' }],
    };

    const [students, callLogs, followUps] = await Promise.all([
      db
        .collection('students')
        .updateMany(missingOwnerFilter, { $set: { ownerId: targetOwnerId } }),
      db
        .collection('calllogs')
        .updateMany(missingOwnerFilter, { $set: { ownerId: targetOwnerId } }),
      db
        .collection('followups')
        .updateMany(missingOwnerFilter, { $set: { ownerId: targetOwnerId } }),
    ]);

    console.log('✅ Legacy claims complete:', {
      studentsUpdated: students.modifiedCount,
      callLogsUpdated: callLogs.modifiedCount,
      followUpsUpdated: followUps.modifiedCount,
    });
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
