/* eslint-disable @typescript-eslint/no-explicit-any */
import CallLog from '@/models/CallLog';
import FollowUp from '@/models/FollowUp';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';
import {
  getMissedReleasedAssignmentCount,
  getStatusFromMissedCount,
  isAssignmentSubmitted,
} from '@/lib/student-progress';

const FOLLOW_UP_DAYS = 7; // Default days for follow-up after a call

const parseAssignmentNumber = (assignment: string | undefined | null) => {
  if (!assignment) return 1;

  const assignmentNumber = parseInt(assignment.split('-')[1], 10);

  return Number.isNaN(assignmentNumber) ? 1 : assignmentNumber;
};

const getQueueStatusFromMissedCount = (missedCount: number) =>
  getStatusFromMissedCount(missedCount);

/**
 * Calculate next follow-up date from a given date
 * Default: date + 7 days
 */
export const calculateNextFollowUp = (date: Date, daysAfter: number = FOLLOW_UP_DAYS): Date => {
  const followUpDate = new Date(date);
  followUpDate.setDate(followUpDate.getDate() + daysAfter);
  return followUpDate;
};

/**
 * Get all overdue follow-ups
 */
export const getOverdueFollowUps = async (ownerId: string) => {
  try {
    const now = new Date();
    const overdueFollowUps = await FollowUp.find({
      date: { $lt: now },
      status: { $ne: 'completed' },
      ownerId,
    }).populate('studentId');

    return overdueFollowUps;
  } catch (error) {
    throw new Error(`Failed to fetch overdue follow-ups: ${error}`);
  }
};

/**
 * Get upcoming follow-ups for specified number of days
 */
export const getUpcomingFollowUps = async (daysAhead: number = 7, ownerId: string) => {
  try {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const upcomingFollowUps = await FollowUp.find({
      date: { $gte: now, $lte: futureDate },
      status: 'pending',
      ownerId,
    })
      .populate('studentId')
      .sort({ date: 1 });

    return upcomingFollowUps;
  } catch (error) {
    throw new Error(`Failed to fetch upcoming follow-ups: ${error}`);
  }
};

/**
 * Auto-create follow-up after a call log is created
 */
export const autoCreateFollowUp = async (
  callLogId: string,
  studentId: string,
  daysAfter: number = FOLLOW_UP_DAYS,
  ownerId: string
) => {
  try {
    const callLog = await CallLog.findOne({ _id: callLogId, ownerId });
    if (!callLog) throw new Error('Call log not found');

    const followUpDate = calculateNextFollowUp(callLog.date, daysAfter);

    const followUp = new FollowUp({
      date: followUpDate,
      note: `Follow-up from call on ${callLog.date.toLocaleDateString()}`,
      studentId,
      ownerId,
      status: 'pending',
    });

    await followUp.save();
    return followUp;
  } catch (error) {
    throw new Error(`Failed to auto-create follow-up: ${error}`);
  }
};

/**
 * A new call means the current queue item has been handled.
 * Keep the call/follow-up history, but close any open follow-ups so the student
 * no longer appears in the generated call queue until a future follow-up is due.
 */
export const resolveOpenFollowUpsAfterCall = async (
  studentId: string,
  completedDate = new Date(),
  ownerId: string
) => {
  return FollowUp.updateMany(
    {
      studentId,
      ownerId,
      status: { $in: ['pending', 'overdue'] },
    },
    {
      $set: {
        status: 'completed',
        completedDate,
      },
    }
  );
};

/**
 * Check if follow-up is needed for a student
 * Returns true if:
 * - No calls made yet, OR
 * - Last call was > 7 days ago, OR
 * - Has overdue follow-ups
 */
export const isFollowUpNeeded = async (studentId: string, ownerId: string): Promise<boolean> => {
  try {
    // Check for existing pending follow-ups
    const pendingFollowUps = await FollowUp.findOne({
      studentId,
      ownerId,
      status: 'pending',
    });

    if (pendingFollowUps) {
      return false; // Already has a pending follow-up
    }

    // Check if overdue follow-up exists
    const overdueFollowUp = await FollowUp.findOne({
      studentId,
      ownerId,
      date: { $lt: new Date() },
      status: { $ne: 'completed' },
    });

    if (overdueFollowUp) {
      return true; // Has overdue follow-up
    }

    // Check last call
    const lastCall = await CallLog.findOne({ studentId, ownerId }).sort({ date: -1 });

    if (!lastCall) {
      return true; // Never called
    }

    // Check if last call was more than 7 days ago
    const daysSinceLastCall = Math.floor(
      (new Date().getTime() - lastCall.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastCall > FOLLOW_UP_DAYS;
  } catch (error) {
    throw new Error(`Failed to check if follow-up needed: ${error}`);
  }
};

/**
 * Get students needing calls (call queue)
 * Returns students with:
 * - Overdue follow-ups
 * - No calls in X days
 * - Pending assignments
 */
export const getCallQueue = async (limit: number = 50, ownerId: string) => {
  try {
    const now = new Date();

    const settings = await Settings.findOne({ ownerId }).lean();
    const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);

    const candidates = await Student.find({
      ownerId,
      currentStatus: {
        $nin: ['Dropped', 'Completed'],
      },
    }).lean();

    const students = candidates.filter((student: any) => {
      const currentAssignment = student.assignments?.find(
        (assignment: any) => assignment.assignmentNumber === currentAssignmentNumber
      );

      return !isAssignmentSubmitted(currentAssignment);
    });

    // Batch status updates using bulkWrite
    const bulkOps: any[] = [];
    for (const student of students) {
      const missedCount = getMissedReleasedAssignmentCount(
        student.assignments,
        currentAssignmentNumber
      );
      const nextStatus = getQueueStatusFromMissedCount(missedCount);

      if (student.currentStatus !== nextStatus) {
        student.currentStatus = nextStatus;
        bulkOps.push({
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { currentStatus: nextStatus } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    if (students.length === 0) {
      return [];
    }

    // Batch query CallLogs and FollowUps in 3 queries instead of 3 * N queries
    const studentIds = students.map((s: any) => s._id);

    const [lastCalls, pendingFollowUps, overdueFollowUps] = await Promise.all([
      CallLog.aggregate([
        { $match: { studentId: { $in: studentIds }, ownerId } },
        { $sort: { date: -1 } },
        {
          $group: {
            _id: '$studentId',
            doc: { $first: '$$ROOT' },
          },
        },
      ]),
      FollowUp.find({
        studentId: { $in: studentIds },
        ownerId,
        status: 'pending',
      }).lean(),
      FollowUp.find({
        studentId: { $in: studentIds },
        ownerId,
        date: { $lt: now },
        status: { $ne: 'completed' },
      }).lean(),
    ]);

    const lastCallMap = new Map<string, any>(
      lastCalls.map((item: any) => [item._id.toString(), item.doc])
    );
    const pendingFollowUpMap = new Map<string, any>(
      pendingFollowUps.map((item: any) => [item.studentId?.toString(), item])
    );
    const overdueFollowUpMap = new Map<string, any>(
      overdueFollowUps.map((item: any) => [item.studentId?.toString(), item])
    );

    const queue = students.map((student: any) => {
      const sId = student._id.toString();
      const lastCall = lastCallMap.get(sId) || null;
      const nextFollowUp = pendingFollowUpMap.get(sId) || null;
      const overdueFollowUp = overdueFollowUpMap.get(sId) || null;

      return {
        ...student,
        lastCall,
        nextFollowUp,
        overdueFollowUp,
        currentAssignmentNumber,
        missedAssignmentCount: getMissedReleasedAssignmentCount(
          student.assignments,
          currentAssignmentNumber
        ),
        priority: student.currentStatus === 'At Risk' ? 'high' : 'normal',
      };
    });

    const sortedQueue = queue.sort((a: any, b: any) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }

      const overdueDiff =
        new Date(a.overdueFollowUp?.date || 0).getTime() -
        new Date(b.overdueFollowUp?.date || 0).getTime();

      if (overdueDiff !== 0) {
        return overdueDiff;
      }

      return new Date(a.lastCall?.date || 0).getTime() - new Date(b.lastCall?.date || 0).getTime();
    });

    return limit > 0 ? sortedQueue.slice(0, limit) : sortedQueue;
  } catch (error) {
    throw new Error(`Failed to get call queue: ${error}`);
  }
};

/**
 * Fast count of students needing calls without enrichment
 */
export const getCallQueueCount = async (ownerId: string): Promise<number> => {
  try {
    const settings = await Settings.findOne({ ownerId }).select('currentAssignment').lean();
    const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);

    const candidates = await Student.find({
      ownerId,
      currentStatus: { $nin: ['Dropped', 'Completed'] },
    })
      .select('assignments')
      .lean();

    return candidates.filter((student: any) => {
      const currentAssignment = student.assignments?.find(
        (assignment: any) => assignment.assignmentNumber === currentAssignmentNumber
      );
      return !isAssignmentSubmitted(currentAssignment);
    }).length;
  } catch (error) {
    console.error('Failed to get call queue count:', error);
    return 0;
  }
};

/**
 * Update follow-up status to overdue if date passed
 */
export const updateOverdueStatus = async (ownerId: string) => {
  try {
    const now = new Date();
    const result = await FollowUp.updateMany(
      {
        ownerId,
        date: { $lt: now },
        status: 'pending',
      },
      {
        $set: { status: 'overdue' },
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to update overdue status: ${error}`);
  }
};

/**
 * Mark follow-up as completed
 */
export const completeFollowUp = async (followUpId: string, ownerId: string) => {
  try {
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: followUpId, ownerId },
      {
        status: 'completed',
        completedDate: new Date(),
      },
      { new: true }
    );

    return followUp;
  } catch (error) {
    throw new Error(`Failed to complete follow-up: ${error}`);
  }
};

/**
 * Get call statistics
 */
export const getCallStatistics = async (ownerId: string) => {
  try {
    const totalCalls = await CallLog.countDocuments({ ownerId });
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const callsThisWeek = await CallLog.countDocuments({
      ownerId,
      date: { $gte: weekAgo },
    });

    const callsByStatus = await CallLog.aggregate([
      {
        $match: { ownerId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const studentsWithCalls = await CallLog.distinct('studentId', { ownerId });
    const totalStudents = await Student.countDocuments({ ownerId });
    const studentsNeverCalled = totalStudents - studentsWithCalls.length;

    const avgCallsPerStudent = totalStudents > 0 ? totalCalls / studentsWithCalls.length : 0;

    // Calculate average days between calls
    const callsData = await CallLog.find({ ownerId }).sort({ date: -1 }).limit(100);
    let totalDaysBetween = 0;
    let gaps = 0;

    for (let i = 1; i < callsData.length; i++) {
      const daysBetween = Math.floor(
        (callsData[i - 1].date.getTime() - callsData[i].date.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDaysBetween += daysBetween;
      gaps++;
    }

    const avgDaysBetweenCalls = gaps > 0 ? totalDaysBetween / gaps : 0;

    // Reachability metrics
    const reachability = {
      high: 0, // RECEIVED calls
      medium: 0, // NOT_RECEIVED
      low: 0, // PHONE_OFF, SWITCHED_OFF, FOREIGN_NUMBER
    };

    callsByStatus.forEach((item: any) => {
      if (item._id === 'RECEIVED') {
        reachability.high = item.count;
      } else if (item._id === 'NOT_RECEIVED') {
        reachability.medium = item.count;
      } else {
        reachability.low += item.count;
      }
    });

    const successRate = totalCalls > 0 ? ((reachability.high / totalCalls) * 100).toFixed(1) : '0';

    return {
      totalCalls,
      callsThisWeek,
      callsByStatus: Object.fromEntries(callsByStatus.map((item: any) => [item._id, item.count])),
      successRate: `${successRate}%`,
      averageCallsPerStudent: Number(avgCallsPerStudent.toFixed(2)),
      studentsNeverCalled,
      avgDaysBetweenCalls: Number(avgDaysBetweenCalls.toFixed(1)),
      reachability,
    };
  } catch (error) {
    throw new Error(`Failed to get call statistics: ${error}`);
  }
};
