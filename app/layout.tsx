import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';
import { GlobalHeader } from '../components/layout/GlobalHeader';

export const metadata = {
  title: 'Action Coach',
  description: 'Stepvia goal assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell">
        <AuthProvider>
          <GlobalHeader />
          <main className="page-with-header">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
