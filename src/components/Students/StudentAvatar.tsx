'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/ui-helpers';
import { cn } from '@/lib/cn';

export type AvatarStyle = 'initials' | 'shapes' | 'bottts-neutral' | 'thumbs';

export interface StudentAvatarProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: AvatarStyle;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

// Curated modern gradients for instant local fallback
const fallbackGradients = [
  'bg-gradient-to-br from-blue-600 to-indigo-600 text-white',
  'bg-gradient-to-br from-emerald-600 to-teal-600 text-white',
  'bg-gradient-to-br from-violet-600 to-purple-600 text-white',
  'bg-gradient-to-br from-rose-600 to-pink-600 text-white',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-br from-cyan-600 to-blue-600 text-white',
  'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white',
  'bg-gradient-to-br from-teal-600 to-emerald-600 text-white',
  'bg-gradient-to-br from-indigo-600 to-cyan-600 text-white',
  'bg-gradient-to-br from-purple-600 to-indigo-600 text-white',
];

function getHashIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % fallbackGradients.length;
}

export function StudentAvatar({
  name = 'User',
  size = 'md',
  style = 'initials',
  className,
}: StudentAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const cleanName = (name || 'User').trim();
  const initials = getInitials(cleanName) || cleanName.slice(0, 2).toUpperCase() || 'U';
  const gradientClass = fallbackGradients[getHashIndex(cleanName)];

  // DiceBear HTTP API with curated color palette & circular radius
  const encodedSeed = encodeURIComponent(cleanName);
  const dicebearUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodedSeed}&radius=50&backgroundColor=0284c7,0d9488,16a34a,4f46e5,7c3aed,c026d3,db2777,ea580c,ca8a04,2563eb&textColor=ffffff&fontWeight=600&fontSize=42`;

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden ring-1 ring-border/60 shadow-xs select-none',
        sizeMap[size],
        gradientClass,
        className
      )}
      title={cleanName}
    >
      {!hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dicebearUrl}
          alt={cleanName}
          className="size-full object-cover transition-opacity duration-200"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-semibold tracking-wider">{initials}</span>
      )}
    </div>
  );
}

// UserAvatar alias for global mentor/user profile display
export const UserAvatar = StudentAvatar;
