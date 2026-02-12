import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

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
      <body className={`${inter.className} ${jetbrains.variable} bg-[#050505] text-emerald-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
