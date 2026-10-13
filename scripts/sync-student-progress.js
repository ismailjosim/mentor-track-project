// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'student-management',
  });
  const students = await mongoose.connection.db.collection('students').find({}).toArray();

  let updatedCount = 0;
  for (const s of students) {
    const compAssignments = (s.assignments || []).filter(
      (a) => typeof a.marks === 'number' && !isNaN(a.marks) && a.marks > 0
    );
    const highest = compAssignments.reduce((max, a) => Math.max(max, a.assignmentNumber || 0), 0);
    const targetKey = highest === 0 ? 'None' : `A-${String(highest).padStart(2, '0')}`;

    if (s.lastCompletedAssignment !== targetKey) {
      await mongoose.connection.db.collection('students').updateOne(
        { _id: s._id },
        { $set: { lastCompletedAssignment: targetKey } }
      );
      updatedCount++;
    }
  }

  console.log(`Synced ${updatedCount} students lastCompletedAssignment!`);
  const finalSummary = await mongoose.connection.db.collection('students').aggregate([
    { $group: { _id: '$lastCompletedAssignment', count: { $sum: 1 } } }
  ]).toArray();
  console.log('New lastCompletedAssignment distribution:', finalSummary);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
