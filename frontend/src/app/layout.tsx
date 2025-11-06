import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VOCH - Voice of Change',
  description: 'Where your voice creates change. Social media meets civic engagement.',
  keywords: ['social media', 'civic engagement', 'polls', 'NGO', 'fundraising', 'voice', 'change'],
  authors: [{ name: 'VOCH Team' }],
  openGraph: {
    title: 'VOCH - Voice of Change',
    description: 'Where your voice creates change',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
