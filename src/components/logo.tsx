import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';
import Link from 'next/link';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <Link2 className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold text-primary-foreground/90 font-headline">LinkFlow</span>
    </Link>
  );
}
