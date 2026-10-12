import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthErrorClient } from '@/components/auth/AuthErrorClient';

export const metadata: Metadata = {
  title: 'Authentication Error | Mentor Track',
  description: 'An error occurred during authentication.',
};

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground mt-4 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthErrorClient />
    </Suspense>
  );
}
