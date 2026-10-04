import { NextResponse } from 'next/server';

/**
 * Liveness probe: returns 200 if the process is running and accepting traffic.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'mentor-track',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
