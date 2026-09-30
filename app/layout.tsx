import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { Shell } from '@/components/Shell';
import { BRAND } from '@/lib/brand';
import './globals.css';

const body = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' });
const cond = Barlow_Condensed({ subsets: ['latin'], weight: ['300', '400'], variable: '--font-cond', display: 'swap' });

export const metadata: Metadata = { title: `${BRAND.name}: ${BRAND.tagline}`, description: 'One live view of schedule, drawings, procurement, site progress, contractors, risks and actions.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cond.variable} ${body.variable}`}>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
