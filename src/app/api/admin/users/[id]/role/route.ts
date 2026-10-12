/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireAdminUser();
    if (authResult.response) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    const validRoles = ['user', 'admin', 'super_admin'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        createResponse(400, 'Invalid role. Must be one of: user, admin, super_admin'),
        { status: 400 }
      );
    }

    const db = (await connectDB()).connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    const userFilter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const targetUser = await db.collection('user').findOne(userFilter);

    if (!targetUser) {
      return NextResponse.json(createResponse(404, 'User not found'), { status: 404 });
    }

    if (targetUser.email?.toLowerCase() === 'ismailjosim99@gmail.com' && role !== 'super_admin') {
      return NextResponse.json(createResponse(400, 'Primary Super Admin cannot be demoted.'), {
        status: 400,
      });
    }

    await db.collection('user').updateOne(userFilter, {
      $set: { role, updatedAt: new Date() },
    });

    return NextResponse.json(
      createResponse(200, `User role updated to ${role} successfully`, {
        userId: id,
        email: targetUser.email,
        role,
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
