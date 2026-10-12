import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginClient } from '@/components/auth/LoginClient';

export const metadata: Metadata = {
  title: 'Sign In | Mentor Track',
  description: 'Sign in to your Mentor Track workspace to manage students, cohorts, and follow-ups.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading workspace...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
