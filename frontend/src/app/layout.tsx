import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'BAV-Connect', template: '%s | BAV-Connect' },
  description: 'Chợ sinh viên Học viện Ngân hàng do ICU Code phát triển.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
