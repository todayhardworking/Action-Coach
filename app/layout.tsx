import type { ReactNode } from 'react';

export const metadata = {
  title: 'Action Coach',
  description: 'Stepvia goal assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
