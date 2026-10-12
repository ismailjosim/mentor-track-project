import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterClient } from '@/components/auth/RegisterClient';

export const metadata: Metadata = {
  title: 'Create Account | Mentor Track',
  description: 'Sign up for Mentor Track to start managing student cohorts and mentor activities.',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading onboarding...</div>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
