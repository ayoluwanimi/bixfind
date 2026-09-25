import { redirect } from 'next/navigation'

export default function ProfileSiteIndexPage() {
  // Legacy route retired — the canonical renderer lives at /p/[slug]
  redirect('/')
}
