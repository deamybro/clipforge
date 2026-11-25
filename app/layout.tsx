import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ExtensionErrorGuard } from '@/components/providers/ExtensionErrorGuard';

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ClipForge - AI Video Clipping for Viral Short-Form Content',
  description:
    'Turn any long video into 3 viral clips in 60 seconds. AI finds your best hooks and creates clean vertical 9:16 clips with background music. Free to start.',
  keywords: ['video clipping', 'AI video editor', 'TikTok clips', 'YouTube Shorts', 'Instagram Reels', 'viral content'],
  openGraph: {
    title: 'ClipForge - AI Video Clipping',
    description: 'Turn any long video into 3 viral clips in 60 seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ExtensionErrorGuard />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#141414',
                  border: '1px solid #2A2A2A',
                  color: '#F5F5F5',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
