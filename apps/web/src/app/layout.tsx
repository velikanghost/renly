import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Nav } from '@/components/nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Renly — Prompt → Live SaaS in 60 Seconds',
  description: 'Generate, deploy, and evolve full-stack applications instantly using AI and BuildWithLocus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-bg">
            <Nav />
            <main>{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
