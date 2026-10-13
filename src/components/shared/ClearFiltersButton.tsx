'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ClearFiltersButtonProps {
  onClear: () => void;
  activeCount?: number;
  label?: string;
  className?: string;
  variant?: 'ghost' | 'outline' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ClearFiltersButton({
  onClear,
  activeCount = 0,
  label = 'Clear',
  className = 'h-9 px-2.5 text-xs',
  variant = 'ghost',
  size = 'sm',
}: ClearFiltersButtonProps) {
  if (activeCount === 0) return null;

  return (
    <Button type="button" variant={variant} size={size} onClick={onClear} className={className}>
      <X className="h-3.5 w-3.5 mr-1" />
      {label}
      {activeCount > 0 && ` (${activeCount})`}
    </Button>
  );
}

export default ClearFiltersButton;
