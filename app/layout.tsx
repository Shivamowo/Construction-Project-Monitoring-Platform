import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Sans } from 'next/font/google';
import { Shell } from '@/components/Shell';
import { BRAND } from '@/lib/brand';
import './globals.css';

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = { title: `${BRAND.name}: ${BRAND.tagline}`, description: 'One live view of schedule, drawings, procurement, site progress, contractors, risks and actions.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
