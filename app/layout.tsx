import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: 'Action Coach | Next.js + Firebase starter',
  description: 'Seed project wired for Firebase Auth and Firestore on Next.js App Router.'
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
