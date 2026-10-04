import { NextResponse } from 'next/server';
import { connectDB, isConnected } from '@/lib/mongodb';

/**
 * Readiness probe: verifies that dependencies (MongoDB connection) are healthy.
 */
export async function GET() {
  try {
    await connectDB();
    const connected = isConnected();

    if (!connected) {
      return NextResponse.json(
        {
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: 'Database check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
