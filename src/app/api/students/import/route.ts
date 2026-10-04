/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import Student from '@/models/Student';
import { processStudentImportFile } from '@/lib/file-parser';
import { connectDB } from '@/lib/mongodb';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const rawCohort = formData.get('cohort');
    const selectedCohort =
      (rawCohort ? String(rawCohort).trim().replace(/[^\d]/g, '') : '') || '14';

    // Process and validate import file with target cohort
    const fileData = await processStudentImportFile(file, selectedCohort);

    // For preview mode - just return validation results
    const previewOnly = formData.get('previewOnly') === 'true';
    if (previewOnly) {
      return NextResponse.json({
        preview: true,
        cohort: selectedCohort,
        headers: fileData.headers,
        totalRows: fileData.rows,
        validCount: fileData.validRows.length,
        invalidCount: fileData.invalidRows.length,
        duplicateCount: fileData.duplicateEmails.length,
        validRows: fileData.validRows.slice(0, 10), // First 10 for preview
        invalidRows: fileData.invalidRows.slice(0, 5), // First 5 errors for preview
        duplicateEmails: fileData.duplicateEmails,
        message: fileData.valid ? 'File is valid' : 'File has validation errors',
      });
    }

    // Actual import - check for existing emails within selected cohort
    const importConfirmed = formData.get('confirmed') === 'true';
    if (!importConfirmed) {
      return NextResponse.json({ error: 'Import not confirmed' }, { status: 400 });
    }

    // Check for duplicate emails in database for this specific cohort
    const emails = fileData.validRows.map((r) => r.email);
    const existingStudents = await Student.find({
      ownerId: userId,
      cohort: selectedCohort,
      email: { $in: emails },
    });
    const existingEmails = existingStudents.map((s: any) => s.email);

    const toCreate = fileData.validRows.filter((row) => !existingEmails.includes(row.email));
    const toUpdate = fileData.validRows.filter((row) => existingEmails.includes(row.email));

    // Create new students tagged with ownerId and cohort
    const created = await Student.insertMany(
      toCreate.map((student) => ({
        ...student,
        cohort: student.cohort || selectedCohort,
        ownerId: userId,
      }))
    );

    // Update existing students in this cohort using bulkWrite in a single database round-trip
    let updated = 0;
    if (toUpdate.length > 0) {
      const bulkOps = toUpdate.map((student) => ({
        updateOne: {
          filter: { ownerId: userId, cohort: selectedCohort, email: student.email },
          update: {
            $set: {
              ...student,
              cohort: student.cohort || selectedCohort,
            },
          },
        },
      }));
      const bulkResult = await Student.bulkWrite(bulkOps);
      updated = bulkResult.modifiedCount || bulkResult.matchedCount || toUpdate.length;
    }

    // Invalidate student-related caches after bulk import/update
    if (created.length > 0 || updated > 0) {
      revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);
    }

    return NextResponse.json({
      success: true,
      cohort: selectedCohort,
      summary: {
        totalProcessed: fileData.validRows.length,
        created: created.length,
        updated: updated,
        skipped: fileData.invalidRows.length + fileData.duplicateEmails.length,
        createdIds: created.map((s: any) => s._id),
      },
      message: `Imported ${created.length} new students and updated ${updated} existing students in Batch ${selectedCohort}`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import students',
      },
      { status: 500 }
    );
  }
}
