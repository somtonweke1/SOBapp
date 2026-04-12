import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'StoneBridge AI | Baltimore Deal Diagnostic Engine',
  description:
    'StoneBridge AI uses Baltimore public infrastructure, procurement, utility, and property data to diagnose hidden deal risk before acquisition or rehab.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className="bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-600 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
