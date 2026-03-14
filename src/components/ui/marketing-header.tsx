import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface MarketingHeaderProps {
  nav?: React.ReactNode;
}

export function MarketingHeader({ nav }: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100"
          aria-label="ArchLog home"
        >
          ArchLog
        </Link>
        {nav}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
