import React from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = { title: 'HITCH', description: 'Safe and Affordable Teslapooling' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-[#111827] min-h-screen antialiased selection:bg-[#0d9488] selection:text-white">
        <AuthProvider>
          <main className="w-full min-h-screen flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}