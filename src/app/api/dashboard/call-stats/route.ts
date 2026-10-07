import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import CallLog from '@/models/CallLog';
import Student from '@/models/Student';
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'week').toLowerCase() as 'day' | 'week' | 'month';
    const rawCohort = searchParams.get('cohort');
    const selectedCohort =
      rawCohort && rawCohort !== 'all' ? rawCohort.trim().replace(/[^\d]/g, '') : null;

    // Filter base
    const callLogFilter: Record<string, unknown> = { ownerId: userId };

    if (selectedCohort) {
      const studentIds = await Student.find({ ownerId: userId, cohort: selectedCohort }).distinct(
        '_id'
      );
      callLogFilter.studentId = { $in: studentIds };
    }

    const now = new Date();
    const buckets: { label: string; start: Date; end: Date }[] = [];

    if (range === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const targetDate = subDays(now, i);
        buckets.push({
          label: format(targetDate, 'EEE, MMM d'),
          start: startOfDay(targetDate),
          end: endOfDay(targetDate),
        });
      }
    } else if (range === 'month') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const targetDate = subMonths(now, i);
        buckets.push({
          label: format(targetDate, 'MMM yyyy'),
          start: startOfMonth(targetDate),
          end: endOfMonth(targetDate),
        });
      }
    } else {
      // Default: Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const targetDate = subWeeks(now, i);
        const wStart = startOfWeek(targetDate, { weekStartsOn: 1 });
        const wEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
        buckets.push({
          label: `${format(wStart, 'MMM d')} - ${format(wEnd, 'MMM d')}`,
          start: wStart,
          end: wEnd,
        });
      }
    }

    const minDate = buckets[0].start;
    const maxDate = buckets[buckets.length - 1].end;

    // Fetch call logs in the total time window
    const logs = await CallLog.find({
      ...callLogFilter,
      date: { $gte: minDate, $lte: maxDate },
    })
      .select('date status')
      .lean();

    let totalCalls = 0;
    let receivedCalls = 0;

    const chartData = buckets.map((bucket) => {
      const matchingLogs = logs.filter((log) => {
        const logDate = new Date(log.date as unknown as string).getTime();
        return logDate >= bucket.start.getTime() && logDate <= bucket.end.getTime();
      });

      const count = matchingLogs.length;
      const received = matchingLogs.filter(
        (log) => (log as { status?: string }).status === 'RECEIVED'
      ).length;
      const notReceived = count - received;

      totalCalls += count;
      receivedCalls += received;

      return {
        label: bucket.label,
        total: count,
        received,
        notReceived,
      };
    });

    const receivedRate = totalCalls > 0 ? Math.round((receivedCalls / totalCalls) * 100) : 0;

    return NextResponse.json(
      createResponse(200, 'Call statistics fetched successfully', {
        range,
        summary: {
          totalCalls,
          receivedCalls,
          notReceivedCalls: totalCalls - receivedCalls,
          receivedRate,
        },
        chartData,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
