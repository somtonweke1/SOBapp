import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SOBapp | Baltimore Real Estate Forensics',
  description: 'SOBapp is the Baltimore Real Estate Forensics Engine for DPW water bill audits, DSCR stress-testing, and property-level risk intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
