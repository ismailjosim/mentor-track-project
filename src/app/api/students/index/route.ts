import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, escapeRegex } from '@/lib/utils';
import Student from '@/models/Student';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    // Get query params for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const device = searchParams.get('device');
    const division = searchParams.get('division');

    // Build filter
    const filter: Record<string, unknown> = { ownerId: userId };
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const escaped = escapeRegex(cleanSearch);
      const digits = cleanSearch.replace(/\D/g, '');
      const isEmailSearch = cleanSearch.includes('@');

      const searchConditions: Record<string, unknown>[] = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];

      if (!isEmailSearch) {
        if (digits.length >= 2) {
          searchConditions.push({ phone: { $regex: digits, $options: 'i' } });
          searchConditions.push({ whatsapp: { $regex: digits, $options: 'i' } });
        } else {
          searchConditions.push({ phone: { $regex: escaped, $options: 'i' } });
        }
      }

      filter.$or = searchConditions;
    }
    if (status) {
      filter.currentStatus = status;
    }
    if (device) {
      filter.workingDevice = device;
    }
    if (division) {
      filter.division = division;
    }

    // Get students
    const students = await Student.find(filter)
      .sort({ name: 1 })
      .collation({ locale: 'en', strength: 2 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      createResponse(200, 'Students fetched successfully', {
        data: students,
        count: students.length,
        total: totalCount,
        page,
        totalPages,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
