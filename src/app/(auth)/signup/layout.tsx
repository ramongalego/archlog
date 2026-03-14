import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free ArchLog account. Log decisions, track outcomes, and search with AI.',
  alternates: { canonical: '/signup' },
  openGraph: {
    title: 'Sign Up | ArchLog',
    description:
      'Create a free ArchLog account. Log decisions, track outcomes, and search with AI.',
    url: '/signup',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
