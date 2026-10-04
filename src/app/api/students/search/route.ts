/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import {
  createResponse,
  handleDbError,
  getPaginationParams,
  logger,
  escapeRegex,
} from '@/lib/utils';
import Student from '@/models/Student';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const { skip } = getPaginationParams(page, limit);

    // Search and Filter Parameters
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');
    const division = searchParams.get('division');
    const ageRange = searchParams.get('ageRange');
    const workingDevice = searchParams.get('workingDevice');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');

    // Build dynamic filter
    const filter: any = { ownerId: userId };

    if (name && name.trim()) {
      filter.name = { $regex: escapeRegex(name.trim()), $options: 'i' };
    }

    if (email && email.trim()) {
      filter.email = { $regex: escapeRegex(email.trim()), $options: 'i' };
    }

    if (phone && phone.trim()) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits) {
        filter.phone = { $regex: phoneDigits, $options: 'i' };
      } else {
        filter.phone = { $regex: escapeRegex(phone.trim()), $options: 'i' };
      }
    }

    if (status) {
      filter.currentStatus = status;
    }

    if (division) {
      filter.division = division;
    }

    if (ageRange) {
      filter.ageRange = ageRange;
    }

    if (workingDevice) {
      filter.workingDevice = workingDevice;
    }

    // Range queries (if needed in future)
    if (ageMin || ageMax) {
      // This would need additional logic for age range queries
    }

    const [students, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(limit).lean(),
      Student.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    logger.info('GET /api/students/search', {
      filters: { name, email, phone, status, division, ageRange, workingDevice },
      total,
    });

    const response = createResponse(200, 'Search completed successfully', students);
    return NextResponse.json(
      {
        ...response,
        pagination: { page, limit, total, pages },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('GET /api/students/search failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
