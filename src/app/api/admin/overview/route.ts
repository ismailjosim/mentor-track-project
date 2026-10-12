/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import FollowUp from '@/models/FollowUp';

export async function GET() {
  try {
    await connectDB();
    const authResult = await requireAdminUser();
    if (authResult.response) return authResult.response;

    const db = (await connectDB()).connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    // 1. System Overall Statistics
    const [totalUsers, totalStudents, distinctCohorts, totalCallLogs, totalFollowUps] =
      await Promise.all([
        db.collection('user').countDocuments(),
        Student.countDocuments(),
        Student.distinct('cohort'),
        CallLog.countDocuments(),
        FollowUp.countDocuments(),
      ]);

    const activeCohorts = distinctCohorts.filter(Boolean).map(String);

    // 2. Registered Users with activity stats
    const rawUsers = await db
      .collection('user')
      .find({})
      .project({ name: 1, email: 1, role: 1, createdAt: 1, updatedAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const usersWithStats = await Promise.all(
      rawUsers.map(async (u: any) => {
        const userIdStr = String(u._id);
        const [studentsCount, callsCount, lastCall] = await Promise.all([
          Student.countDocuments({ ownerId: userIdStr }),
          CallLog.countDocuments({ ownerId: userIdStr }),
          CallLog.findOne({ ownerId: userIdStr }).sort({ date: -1 }).select('date').lean(),
        ]);

        const assignedRole =
          u.email?.toLowerCase() === 'ismailjosim99@gmail.com' ? 'super_admin' : u.role || 'user';

        return {
          id: userIdStr,
          name: u.name || 'Unnamed User',
          email: u.email,
          role: assignedRole,
          createdAt: u.createdAt || null,
          studentsCount,
          callsCount,
          lastCallDate: (lastCall as any)?.date || null,
        };
      })
    );

    // 3. Batch / Cohort Summaries
    const batchAggregations = await Student.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$cohort', 'Unassigned'] },
          totalStudents: { $sum: 1 },
          joinedMentorship: {
            $sum: { $cond: [{ $eq: ['$mentorshipJoiningStatus', true] }, 1, 0] },
          },
          completedStudents: {
            $sum: { $cond: [{ $eq: ['$lastCompletedAssignment', 'A-10'] }, 1, 0] },
          },
          onTrackStudents: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'On Track'] }, 1, 0] },
          },
          atRiskStudents: {
            $sum: { $cond: [{ $in: ['$currentStatus', ['Behind', 'At Risk']] }, 1, 0] },
          },
          uniqueMentors: { $addToSet: '$ownerId' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const batches = batchAggregations.map((b: any) => ({
      cohort: b._id,
      totalStudents: b.totalStudents,
      joinedMentorship: b.joinedMentorship,
      notJoinedMentorship: b.totalStudents - b.joinedMentorship,
      completedStudents: b.completedStudents,
      onTrackStudents: b.onTrackStudents,
      atRiskStudents: b.atRiskStudents,
      mentorsCount: b.uniqueMentors?.length || 0,
      joinRate: b.totalStudents > 0 ? Math.round((b.joinedMentorship / b.totalStudents) * 100) : 0,
    }));

    // 4. Overall Recent Activities
    const [recentCalls, recentStudents] = await Promise.all([
      CallLog.find({})
        .sort({ date: -1 })
        .limit(15)
        .populate('studentId', 'name cohort phone')
        .lean(),
      Student.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email phone cohort currentStatus createdAt ownerId')
        .lean(),
    ]);

    const activities = recentCalls.map((c: any) => ({
      id: String(c._id),
      type: 'call',
      title: `Call: ${(c.studentId as any)?.name || 'Student'} (${c.status})`,
      studentName: (c.studentId as any)?.name,
      studentCohort: (c.studentId as any)?.cohort,
      mentorName: c.calledBy || 'Mentor',
      ownerId: c.ownerId,
      status: c.status,
      date: c.date,
      notes: c.notes,
    }));

    return NextResponse.json(
      createResponse(200, 'System admin overview fetched successfully', {
        stats: {
          totalUsers,
          totalStudents,
          totalBatches: activeCohorts.length,
          totalCallLogs,
          totalFollowUps,
        },
        users: usersWithStats,
        batches,
        recentActivities: activities,
        recentStudents,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
