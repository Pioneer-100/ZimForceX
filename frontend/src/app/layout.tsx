import type { Metadata } from 'next'
import './globals.css'
import Header from '../components/Header'

export const metadata: Metadata = {
  title: 'ZimForceX — Connect. Share. Grow.',
  description: 'Career networking that actually works',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
