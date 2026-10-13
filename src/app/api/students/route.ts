/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import {
  createResponse,
  handleDbError,
  handleZodError,
  getPaginationParams,
  logger,
  sanitizeInput,
  escapeRegex,
} from '@/lib/utils';
import { StudentCreateSchema } from '@/lib/validators';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId, getCurrentSession, isSuperAdminEmail } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const cohort = searchParams.get('cohort') || '';
    const progress = searchParams.get('progress') || '';
    const submittedAssignment = searchParams.get('submittedAssignment') || '';
    const notSubmittedAssignment = searchParams.get('notSubmittedAssignment') || '';
    const group = searchParams.get('group') || '';
    const device = searchParams.get('device') || '';
    const programType = searchParams.get('programType') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrderParam = searchParams.get('sortOrder');
    const sortOrder = sortOrderParam === 'desc' ? -1 : 1;

    const { skip } = getPaginationParams(page, limit);

    const session = await getCurrentSession();
    const isSuperAdmin = session?.user && isSuperAdminEmail(session.user.email);

    // Build query filter
    const filter: any = {};
    if (!isSuperAdmin) {
      filter.ownerId = userId;
    } else {
      // Super-admin: scope to own students if any exist, otherwise allow viewing repository students
      const ownCount = await Student.countDocuments({ ownerId: userId });
      if (ownCount > 0) {
        filter.ownerId = userId;
      }
    }
    const andConditions: any[] = [];

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const escaped = escapeRegex(cleanSearch);
      const digits = cleanSearch.replace(/\D/g, '');
      // If the search term contains "@" treat it as an email search and skip phone matching
      const isEmailSearch = cleanSearch.includes('@');

      const searchConditions: any[] = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];

      if (!isEmailSearch) {
        // If user typed digits (e.g. phone or partial phone number), match against phone & whatsapp
        if (digits.length >= 2) {
          searchConditions.push({ phone: { $regex: digits, $options: 'i' } });
          searchConditions.push({ whatsapp: { $regex: digits, $options: 'i' } });
        } else {
          // Otherwise, allow matching exact escaped string against phone field
          searchConditions.push({ phone: { $regex: escaped, $options: 'i' } });
        }
      }

      andConditions.push({ $or: searchConditions });
    }

    if (status) {
      filter.currentStatus = status;
    }

    if (cohort && cohort !== 'all') {
      const cleaned = cohort.trim().replace(/[^\d]/g, '');
      if (cleaned) {
        andConditions.push({
          $or: [
            { cohort },
            { cohort: cleaned },
            { cohort: `Batch ${cleaned}` },
            { cohort: new RegExp(`^.*${cleaned}.*$`, 'i') },
          ],
        });
      } else {
        filter.cohort = cohort;
      }
    }

    if (progress) {
      const progressNumber = parseInt(progress, 10);

      if (!Number.isNaN(progressNumber) && progressNumber >= 0 && progressNumber <= 10) {
        if (progressNumber === 0) {
          andConditions.push({
            $or: [
              { lastCompletedAssignment: 'None' },
              { lastCompletedAssignment: '' },
              { lastCompletedAssignment: null },
              { lastCompletedAssignment: { $exists: false } },
            ],
          });
        } else {
          filter.lastCompletedAssignment = `A-${String(progressNumber).padStart(2, '0')}`;
        }
      }
    }

    // Filter by specific submitted assignment (e.g. Assignment 6 submitted)
    if (submittedAssignment && submittedAssignment !== 'all') {
      const subNum = parseInt(submittedAssignment.replace(/\D/g, ''), 10);
      if (!Number.isNaN(subNum) && subNum >= 0 && subNum <= 10) {
        if (subNum === 0) {
          andConditions.push({
            $or: [
              { lastCompletedAssignment: 'None' },
              { lastCompletedAssignment: '' },
              { lastCompletedAssignment: null },
              { lastCompletedAssignment: { $exists: false } },
            ],
          });
        } else {
          andConditions.push({
            $or: [
              {
                assignments: {
                  $elemMatch: {
                    assignmentNumber: subNum,
                    $or: [{ status: { $in: ['SUBMITTED', 'COMPLETED'] } }, { marks: { $gt: 0 } }],
                  },
                },
              },
              {
                lastCompletedAssignment: {
                  $in: Array.from(
                    { length: 11 - subNum },
                    (_, i) => `A-${String(subNum + i).padStart(2, '0')}`
                  ),
                },
              },
            ],
          });
        }
      }
    }

    // Filter by specific NOT submitted assignment (e.g. Assignment 7 NOT submitted)
    if (
      notSubmittedAssignment &&
      notSubmittedAssignment !== 'none' &&
      notSubmittedAssignment !== 'all'
    ) {
      const notSubNum = parseInt(notSubmittedAssignment.replace(/\D/g, ''), 10);
      if (!Number.isNaN(notSubNum) && notSubNum >= 1 && notSubNum <= 10) {
        andConditions.push({
          $nor: [
            {
              assignments: {
                $elemMatch: {
                  assignmentNumber: notSubNum,
                  $or: [{ status: { $in: ['SUBMITTED', 'COMPLETED'] } }, { marks: { $gt: 0 } }],
                },
              },
            },
            {
              lastCompletedAssignment: {
                $in: Array.from(
                  { length: 11 - notSubNum },
                  (_, i) => `A-${String(notSubNum + i).padStart(2, '0')}`
                ),
              },
            },
          ],
        });
      }
    }

    if (group === 'in-group') {
      filter.mentorshipJoiningStatus = true;
    }

    if (group === 'missing') {
      andConditions.push({
        $or: [
          { mentorshipJoiningStatus: false },
          { mentorshipJoiningStatus: { $exists: false } },
          { mentorshipJoiningStatus: null },
        ],
      });
    }

    if (device === 'none') {
      andConditions.push({
        $or: [
          { workingDevice: '' },
          { workingDevice: null },
          { workingDevice: { $exists: false } },
        ],
      });
    } else if (device) {
      filter.workingDevice = device;
    }

    if (programType) {
      filter.programType = programType;
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Expanded sortBy field mapping
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      student: 'name',
      progress: 'lastCompletedAssignment',
      lastCompletedAssignment: 'lastCompletedAssignment',
      status: 'currentStatus',
      currentStatus: 'currentStatus',
      group: 'mentorshipJoiningStatus',
      mentorshipJoiningStatus: 'mentorshipJoiningStatus',
      lastSubmitted: 'lastCompletedAssignment',
      avgMarks: 'scicMarks',
      scicMarks: 'scicMarks',
      createdAt: 'createdAt',
      lastContactedAt: 'lastContactedAt',
    };
    const sortField = sortFieldMap[sortBy] || 'name';

    const sortObj: any = { [sortField]: sortOrder };

    const query = Student.find(filter).sort(sortObj);
    if (sortField === 'name') {
      query.collation({ locale: 'en', strength: 2 });
    }

    const [students, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Student.countDocuments(filter),
    ]);

    // Batch enrich students with assignment count and last call date (eliminating N+1 query - Rule 6)
    const studentIds = students.map((s: any) => s._id);
    const callLogMatch: any = { studentId: { $in: studentIds } };
    if (filter.ownerId) {
      callLogMatch.ownerId = userId;
    }
    const lastCalls =
      studentIds.length > 0
        ? await CallLog.aggregate([
            { $match: callLogMatch },
            { $sort: { date: -1 } },
            {
              $group: {
                _id: '$studentId',
                lastCallDate: { $first: '$date' },
              },
            },
          ])
        : [];

    const callMap = new Map<string, string | Date>();
    for (const call of lastCalls) {
      callMap.set(String(call._id), call.lastCallDate);
    }

    const enrichedStudents = students.map((student: any) => ({
      ...student,
      assignmentCount: student.assignments?.length || 0,
      lastCallDate: callMap.get(String(student._id)) || null,
    }));

    const pages = Math.ceil(total / limit);

    logger.info('GET /api/students', {
      page,
      limit,
      search,
      status,
      progress,
      group,
      device,
      total,
    });

    const response = createResponse(200, 'Students fetched successfully', enrichedStudents);
    return NextResponse.json(
      {
        ...response,
        pagination: { page, limit, total, pages },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('GET /api/students failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();
    const sanitizedData = sanitizeInput(body);
    const validatedData = StudentCreateSchema.parse(sanitizedData);

    const student = new Student({
      ...validatedData,
      cohort: validatedData.cohort || '14',
      ownerId: userId,
    });
    await student.save();

    // Invalidate student-related caches
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);

    logger.info('POST /api/students', { studentId: student._id, email: student.email });
    const response = createResponse(201, 'Student created successfully', student);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
