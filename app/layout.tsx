import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';

export const metadata = {
  title: 'Action Coach',
  description: 'Stepvia goal assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
