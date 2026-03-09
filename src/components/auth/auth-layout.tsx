import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100"
          >
            ArchLog
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm shadow-gray-100/50 dark:shadow-none space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">{footer}</p>
      </div>
    </div>
  );
}
