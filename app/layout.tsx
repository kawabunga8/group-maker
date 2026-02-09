import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Group Maker',
  description: 'Create random groups from your class easily',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
