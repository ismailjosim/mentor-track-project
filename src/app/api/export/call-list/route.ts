/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import Student from '@/models/Student';
import { connectDB } from '@/lib/mongodb';
import { generateCallList, exportToExcel, generateExportFilename } from '@/lib/export';
import { requireCurrentUserId, getCurrentSession, isSuperAdminEmail } from '@/lib/auth-utils';
import { escapeRegex } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const cohort = searchParams.get('cohort') || '';
    const progress = searchParams.get('progress') || '';
    const submittedAssignment = searchParams.get('submittedAssignment') || '';
    const notSubmittedAssignment = searchParams.get('notSubmittedAssignment') || '';
    const group = searchParams.get('group') || '';
    const device = searchParams.get('device') || '';
    const programType = searchParams.get('programType') || '';

    const session = await getCurrentSession();
    const isSuperAdmin = session?.user && isSuperAdminEmail(session.user.email);

    const filter: any = {};
    if (!isSuperAdmin) {
      filter.ownerId = userId;
    } else {
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

      const searchConditions: any[] = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];

      if (digits.length >= 2) {
        searchConditions.push({ phone: { $regex: digits, $options: 'i' } });
        searchConditions.push({ whatsapp: { $regex: digits, $options: 'i' } });
      } else {
        searchConditions.push({ phone: { $regex: escaped, $options: 'i' } });
      }

      andConditions.push({ $or: searchConditions });
    }

    if (status && status !== 'all') {
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

    if (progress && progress !== 'all') {
      const progressNumber = parseInt(progress, 10);

      if (!Number.isNaN(progressNumber) && progressNumber >= 0 && progressNumber <= 10) {
        if (progressNumber === 0) {
          andConditions.push({
            $or: [
              { lastCompletedAssignment: 'None' },
              { lastCompletedAssignment: null },
              { lastCompletedAssignment: { $exists: false } },
            ],
          });
        } else {
          filter.lastCompletedAssignment = `A-${String(progressNumber).padStart(2, '0')}`;
        }
      }
    }

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
    } else if (device && device !== 'all') {
      filter.workingDevice = device;
    }

    if (programType && programType !== 'all') {
      filter.programType = programType;
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Fetch all matching students for the sheet, not just the current page.
    const students = await Student.find(filter)
      .populate('callLogs', 'date status')
      .lean()
      .sort({ currentStatus: 1, lastCompletedAssignment: 1, name: 1 });

    // Generate call list data
    const callListData = generateCallList(students);

    // Export to Excel
    const blob = exportToExcel(callListData);
    const buffer = await blob.arrayBuffer();

    // Create filename with date
    const filename = generateExportFilename('FilteredCallList', 'xlsx');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export call list',
      },
      { status: 500 }
    );
  }
}
