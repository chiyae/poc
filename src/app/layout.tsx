
import type { Metadata } from 'next';
import { PT_Sans, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-provider';
import { SettingsProvider } from '@/context/settings-provider';
import { CommandPalette } from '@/components/command-palette';
import { InactivityMonitor } from '@/components/inactivity-monitor';
import { checkAndRunScheduledBackup } from '@/app/actions/backup-actions';

// Self-host fonts for offline support
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MediTrack Pro',
  description: 'Inventory Management for Clinics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Trigger scheduled backup check on server-side render
  checkAndRunScheduledBackup().catch(console.error);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${sourceCodePro.variable} font-body antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SettingsProvider>
              {children}
              <CommandPalette />
              <InactivityMonitor />
            </SettingsProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

