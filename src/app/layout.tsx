import type { Metadata, Viewport } from 'next';
import './globals.css';

import { Toaster } from 'react-hot-toast';
import { AppShell } from '@/components/Layout/AppShell';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { NextThemeProvider } from '@/components/providers/NextThemeProvider';

const siteUrl =
  process.env.NEXT_PUBLIC_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MentorTrack - Student Mentorship Management',
    template: '%s | MentorTrack',
  },
  description:
    'A focused workspace for tracking student progress, assignments, mentor outreach, and follow-ups.',
  applicationName: 'MentorTrack',
  keywords: [
    'student mentorship',
    'student progress tracking',
    'cohort management',
    'mentor outreach',
    'assignment tracking',
  ],
  creator: 'MentorTrack',
  category: 'education',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'MentorTrack',
    title: 'MentorTrack - Student Mentorship Management',
    description:
      'Track student progress, assignments, mentor outreach, and follow-ups in one workspace.',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'MentorTrack logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'MentorTrack - Student Mentorship Management',
    description:
      'Track student progress, assignments, mentor outreach, and follow-ups in one workspace.',
    images: ['/android-chrome-512x512.png'],
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-image-preview': 'none',
      'max-snippet': 0,
      'max-video-preview': 0,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#151329' },
  ],
  colorScheme: 'light dark',
};

import { BatchProvider } from '@/components/providers/BatchProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full bg-background" suppressHydrationWarning>
        <NextThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <BatchProvider>
                <Toaster position="top-center" />
                <AppShell>{children}</AppShell>
              </BatchProvider>
            </QueryProvider>
          </AuthProvider>
        </NextThemeProvider>
      </body>
    </html>
  );
}
