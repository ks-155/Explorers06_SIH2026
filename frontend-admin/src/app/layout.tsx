import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { TopNav } from '@/components/ui/TopNav';

export const metadata: Metadata = {
  title: 'SOIS Admin — Employer + Government',
  description: 'Member 2 Frontend (M4/M5) — :3002 — SOIS PS 26135',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900" style={{ fontFamily: 'Geist, ui-sans-serif, system-ui' }}>
        <Providers>
          <TopNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
