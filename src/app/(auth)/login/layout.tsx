import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to your ArchLog account to access your decision log.',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'Log In | ArchLog',
    description: 'Sign in to your ArchLog account to access your decision log.',
    url: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
