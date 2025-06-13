'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  isSuccessful,
  style,
  className,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className={cn('relative', className)}
      style={style}
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
