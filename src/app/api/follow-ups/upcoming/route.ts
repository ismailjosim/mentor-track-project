/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, getPaginationParams } from '@/lib/utils';
import FollowUp from '@/models/FollowUp';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/follow-ups/upcoming
 * Get upcoming follow-ups for this week and month
 * Grouped by date for scheduling
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { skip } = getPaginationParams(page, limit);

    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Get upcoming follow-ups
    const upcomingFollowUps = await FollowUp.find({
      ownerId: userId,
      date: { $gte: now, $lte: futureDate },
      status: 'pending',
    })
      .populate('studentId')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await FollowUp.countDocuments({
      ownerId: userId,
      date: { $gte: now, $lte: futureDate },
      status: 'pending',
    });

    // Group by date
    const grouped: any = {};
    upcomingFollowUps.forEach((followUp: any) => {
      const dateStr = followUp.date.toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(followUp);
    });

    // Calculate priority grouping
    const todayStr = now.toISOString().split('T')[0];
    const priority = {
      today: grouped[todayStr] || [],
      upcoming: Object.entries(grouped).filter(([key]) => key !== todayStr),
    };

    const pages = Math.ceil(total / limit);

    const response = createResponse(200, 'Upcoming follow-ups fetched successfully', {
      data: priority,
      stats: {
        total,
        todayCount: priority.today.length,
        upcomingCount: total - priority.today.length,
      },
      pagination: { page, limit, total, pages },
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
