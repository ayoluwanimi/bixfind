import { getProviderTheme, ProviderThemeProvider } from '@bixfind/core'

async function getWebsiteData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/mini-websites?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data
    }
  } catch {}
  return null
}

export default async function PublicProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const website = await getWebsiteData(slug)
  const theme = getProviderTheme(website)

  return (
    <ProviderThemeProvider website={website}>
      <div
        style={{
          '--palette-primary': theme.palette[0],
          '--palette-background': theme.palette[1],
          '--palette-accent': theme.palette[2],
          '--font-body': theme.fontFamily,
          '--font-heading': theme.headingFontFamily,
          fontFamily: theme.fontFamily,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ProviderThemeProvider>
  )
}
