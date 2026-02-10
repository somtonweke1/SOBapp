import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SOBapp | Baltimore Real Estate Forensics',
  description: 'SOBapp is the Sons of Baltimore Forensics Engine for DPW water bill audits, DSCR stress-testing, and property-level risk intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-slate-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
