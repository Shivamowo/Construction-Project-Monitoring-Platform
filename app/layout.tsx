import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { Shell } from '@/components/Shell';
import { BRAND } from '@/lib/brand';
import './globals.css';

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-barlow', display: 'swap' });
const condensed = Barlow_Condensed({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-condensed', display: 'swap' });

export const metadata: Metadata = { title: `${BRAND.name}: ${BRAND.tagline}`, description: 'One live view of schedule, drawings, procurement, site progress, contractors, risks and actions.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${condensed.variable}`}>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
