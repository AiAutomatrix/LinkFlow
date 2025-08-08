import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';
import Link from 'next/link';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 group', className)}>
      <Link2 className={cn("h-6 w-6 text-primary transition-colors group-hover:text-white", className && "text-white")} />
      <span className={cn("text-xl font-bold text-foreground transition-colors group-hover:text-white", className && "text-white")}>LinkFlow</span>
    </Link>
  );
}