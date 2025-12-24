import { fontVariables } from '@/lib/font';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow-Book | Dark Pool DEX on Arbitrum Stylus',
  description:
    'Zero MEV, Zero Slippage, Institutional-grade privacy. Trade on the first dark pool limit order book powered by Arbitrum Stylus.'
};

export const viewport: Viewport = {
  themeColor: '#09090b'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'bg-black min-h-screen font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color="#22c55e" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
