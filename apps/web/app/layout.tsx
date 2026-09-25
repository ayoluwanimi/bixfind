import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/Toaster'
import { NotificationProvider } from '@/context/NotificationContext'
import { ChatProviderWrapper } from '@/components/ChatProviderWrapper'
import InactivityProvider from '@/components/InactivityProvider'
import { Providers } from '@/components/Providers'
import NetworkStatus from '@/components/NetworkStatus'

export const metadata: Metadata = {
  title: 'Bixfind - Find Every Service, Every Provider, Everywhere',
  description: 'Discover and book trusted service providers in Nigeria. Find plumbers, electricians, caterers, barbers, and more near you.',
  keywords: 'service providers Nigeria, find services, local services, plumber, electrician, caterer, barber, Nigeria marketplace',
  authors: [{ name: 'Bixfind' }],
  openGraph: {
    title: 'Bixfind - Find Every Service, Every Provider, Everywhere',
    description: 'Connect with trusted service providers in your area. From home repairs to professional services.',
    url: 'https://bixfind.indevs.in',
    siteName: 'Bixfind',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bixfind - Find Every Service, Every Provider, Everywhere',
    description: 'Connect with trusted service providers in your area.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Bixfind",
            "url": "https://bixfind.indevs.in",
            "description": "Service marketplace connecting customers with trusted providers",
            "areaServed": "Nigeria",
          })
        }} />
      </head>
      <body className="bg-gray-50 min-h-screen flex flex-col" suppressHydrationWarning>
        <div className="fixed top-0 right-0 z-[9999] m-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white/70 tracking-wider font-mono pointer-events-none">
          Reg no: 9491480
        </div>
        <Providers>
          <NotificationProvider>
            <ChatProviderWrapper>
              <InactivityProvider>
                <div className="flex-1">{children}</div>
              </InactivityProvider>
              <footer className="w-full text-center py-3 text-[11px] text-gray-500 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
                Developed and Powered by{' '}
                <a href="https://renasteredev.online/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                  Renasteredev
                </a>
                {' '}- renasteredev.online
              </footer>
              <Toaster position="top-right" />
              <NetworkStatus />
            </ChatProviderWrapper>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  )
}
