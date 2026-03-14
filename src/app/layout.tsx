import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://archlog.app';

export const metadata: Metadata = {
  title: {
    template: '%s | ArchLog',
    default: 'ArchLog · Decision Memory for Teams',
  },
  description:
    'Log decisions as they happen. Track outcomes over time. Search your history with AI.',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'ArchLog',
    title: 'ArchLog · Decision Memory for Teams',
    description:
      'Log decisions as they happen. Track outcomes over time. Search your history with AI.',
    url: siteUrl,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ArchLog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArchLog · Decision Memory for Teams',
    description:
      'Log decisions as they happen. Track outcomes over time. Search your history with AI.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Inline script to set dark class before first paint (prevents flash)
const themeScript = `(function(){try{var t=localStorage.getItem('archlog-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
