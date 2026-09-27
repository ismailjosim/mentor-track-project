'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import toast from 'react-hot-toast';

type GoogleAuthButtonProps = {
  callbackUrl?: string;
  label: string;
};

function getLocalCallbackUrl(callbackUrl?: string) {
  return callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/dashboard';
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.5c2-1.9 2.7-4.6 2.7-7.9Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.9 0 5.3-1 7-2.6l-3.5-2.8c-1 .7-2.2 1.1-3.5 1.1-2.8 0-5.2-1.9-6-4.5H2.4v2.9A10 10 0 0 0 12 22Z"
      />
      <path fill="#FBBC05" d="M6 13.2a6 6 0 0 1 0-3.9v-3H2.4a10 10 0 0 0 0 9.8L6 13.2Z" />
      <path
        fill="#EA4335"
        d="M12 5.3c1.6 0 3 .5 4.1 1.6l3.1-3A10 10 0 0 0 2.4 6.3L6 9.3c.8-2.4 3.2-4 6-4Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ callbackUrl, label }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    await authClient.signIn.social(
      {
        provider: 'google',
        callbackURL: getLocalCallbackUrl(callbackUrl),
        errorCallbackURL: '/auth/error',
      },
      {
        onError: (ctx: { error: { message?: string } }) => {
          toast.error(ctx.error.message || 'Could not continue with Google');
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      <GoogleIcon />
      {isLoading ? 'Connecting to Google...' : label}
    </Button>
  );
}
