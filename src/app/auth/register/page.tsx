'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BrandLogo } from '@/components/BrandLogo';
import { authClient } from '@/lib/auth-client';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<RegisterFormData>({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    if (!data.name.trim() || !data.email.trim() || !data.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (data.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    await authClient.signUp.email(
      {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.success('Account created successfully!');
          router.push('/dashboard');
          router.refresh();
        },
        onError: (ctx: { error: { message?: string } }) => {
          const message = ctx.error.message || 'Registration failed';
          setError(message);
          toast.error(message);
        },
      }
    );

    setIsLoading(false);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[.9fr_1.1fr]">
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <BrandLogo
            className="mb-8"
            imageClassName="size-12 object-contain"
            textClassName="font-bold"
          />
          <p className="text-sm font-bold text-primary">Start your workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set up a focused home for student progress and outreach.
          </p>

          <div className="mt-8">
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <GoogleAuthButton label="Sign up with Google" />

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or sign up with email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
              <div>
                <Label htmlFor="name" className="mb-2 block text-sm font-semibold">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  {...register('name', { required: true })}
                  placeholder="Mentor Name"
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

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
                  placeholder="At least 8 characters"
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-foreground hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_20%,white_0,transparent_32%),radial-gradient(circle_at_80%_80%,white_0,transparent_24%)]" />
        <div className="relative flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
            Cohort 14 Ready
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-primary-foreground/75">
            <Sparkles className="size-4" /> Fast onboarding
          </span>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-foreground/65">
            Built for execution
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Track students, schedule calls, and keep the cohort moving forward together.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-primary-foreground/75">
            Give mentors clarity on who needs help today, who missed yesterday, and who is ready for
            the next milestone.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/55">Antigravity Mentor Suite</p>
      </div>
    </div>
  );
}
