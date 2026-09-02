import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOIS Admin — Employer + Government',
  description: 'Member 2 Frontend (M4/M5) — :3002 — SOIS PS 26135',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <nav className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4 text-sm">
            <a href="/login" className="font-semibold text-teal-700">
              SOIS Admin
            </a>
            <a href="/login" className="text-gray-600 hover:underline">
              Login
            </a>
            <a href="/dashboard" className="text-gray-600 hover:underline">
              Gov Dashboard
            </a>
            <a href="/employer/me" className="text-gray-600 hover:underline">
              Employer
            </a>
            <a href="/health" className="text-gray-600 hover:underline">
              Health
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
