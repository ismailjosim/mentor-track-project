'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BrandLogo } from '@/components/BrandLogo';
import { authClient } from '@/lib/auth-client';

interface LoginFormData {
  email: string;
  password: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();

  const requestedCallbackUrl = searchParams.get('callbackUrl');
  const callbackUrl =
    requestedCallbackUrl?.startsWith('/') && !requestedCallbackUrl.startsWith('//')
      ? requestedCallbackUrl
      : '/dashboard';

  useEffect(() => {
    if (session?.user) {
      router.replace(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorFromUrl = searchParams.get('error');

  const { register, handleSubmit } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    if (!data.email || !data.password) {
      setError('Please enter email and password');
      setIsLoading(false);
      return;
    }

    if (!data.email.includes('@')) {
      setError('Please enter a valid email');
      setIsLoading(false);
      return;
    }

    await authClient.signIn.email(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          toast.success('Login successful!');
          router.push(callbackUrl);
          router.refresh();
        },
        onError: (ctx: { error: { message?: string } }) => {
          const message = ctx.error.message || 'Login failed';
          setError(message);
          toast.error(message);
        },
      }
    );
    setIsLoading(false);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_20%,white_0,transparent_32%),radial-gradient(circle_at_80%_80%,white_0,transparent_24%)]" />
        <BrandLogo
          className="relative"
          imageClassName="size-12 rounded-xl bg-white/95 p-1 object-contain shadow-sm"
          textClassName="text-lg font-bold"
        />
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-foreground/65">
            Student success, organized
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tighter">
            See who needs attention before they fall behind.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-primary-foreground/75">
            One calm workspace for cohort progress, mentor outreach, assignments, and follow-ups.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-primary-foreground/80 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Live cohort insights
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" /> Secure team access
            </span>
          </div>
        </div>
        <p className="relative text-xs text-primary-foreground/55">Mentor operations platform</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo
              className="mb-6"
              imageClassName="size-12 object-contain"
              textClassName="font-bold"
            />
          </div>
          <p className="text-sm font-bold text-primary">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Sign in to your workspace</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Continue managing student progress and mentor follow-ups.
          </p>

          <div className="mt-8">
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {errorFromUrl && (
              <div className="mb-4 p-4 bg-warning-soft border border-warning-border rounded-lg">
                <p className="text-warning-foreground text-sm">
                  {errorFromUrl === 'unauthorized'
                    ? 'You do not have permission to access this page'
                    : 'An error occurred during login'}
                </p>
              </div>
            )}

            <GoogleAuthButton callbackUrl={callbackUrl} label="Continue with Google" />

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or continue with email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-2 block text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="you@example.com"
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block text-sm font-semibold">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  {...register('password', { required: true })}
                  placeholder="Password"
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-bold text-foreground hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
