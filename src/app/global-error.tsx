'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Critical application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-semibold mb-2">Application Error</h1>
          <p className="text-sm text-slate-400 mb-6">
            A critical system error occurred. Our engineering team has been notified.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reload System
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Return Home
            </Link>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-slate-500 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
