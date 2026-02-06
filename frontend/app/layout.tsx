import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bixfind - Find Every Service, Every Provider, Everywhere',
  description: 'Discover and book services from trusted providers in your area. From home maintenance to professional services.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}
