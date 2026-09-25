'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@bixfind/ui'
import { PalettePicker, TemplateGallery, FontPairPicker, BlockEditor } from '@bixfind/ui'
import {
  BUILDER_SECTIONS,
  TEMPLATES,
  DEFAULT_TEMPLATE,
  DEFAULT_PALETTE,
  DEFAULT_FONT_PAIR,
  getTemplateById,
  getAllPalettes,
  type Density,
  type TemplateConfig,
} from '@bixfind/design-tokens/src/builder'
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Undo2,
  Redo2,
  Save,
  Send,
  Check,
  PartyPopper,
  Loader2,
  ChevronDown,
  Copy,
  Share2,
  Image,
  Settings,
  Search,
  Upload,
} from 'lucide-react'
import { storage } from '@/lib/storage'
import Confetti from 'react-dom-confetti'
import { toast } from 'sonner'
import { Music, Hotel, ShoppingBag, MessageSquare, CreditCard, HelpCircle } from 'lucide-react'

type Block = {
  id: string
  sectionId: string
  content: Record<string, unknown>
  visible: boolean
}

type ProviderCapabilities = {
  has_products: boolean
  music: boolean
  hotel: boolean
  gallery: boolean
}

const CATEGORY_CAPABILITIES: Record<string, string[]> = {
  music: ['Music', 'Audio', 'Entertainment', 'DJ', 'Band', 'Singer', 'Musician'],
  hotel: ['Hotel', 'Food', 'Restaurant', 'Accommodation', 'Lodging', 'Catering', 'Bar'],
  gallery: ['Photography', 'Art', 'Design', 'Fashion', 'Makeup', 'Styling', 'Videography'],
}

const API_BASE = ''

export default function ProviderWebsitePage() {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    BUILDER_SECTIONS.filter(s => s.always).map(s => ({
      id: `${s.id}-initial`,
      sectionId: s.id,
      content: { ...s.defaultContent },
      visible: true,
    }))
  )
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE.id)
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE.name)
  const [customColors, setCustomColors] = useState<Record<string, string> | null>(null)
  const [fontPairId, setFontPairId] = useState(DEFAULT_FONT_PAIR.id)
  const [density, setDensity] = useState<Density>('comfortable')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [selectedTab, setSelectedTab] = useState<'blocks' | 'template' | 'palette' | 'fonts' | 'ai' | 'settings'>('blocks')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [footerBusinessName, setFooterBusinessName] = useState('')
  const [footerTagline, setFooterTagline] = useState('')
  const [footerShowSocial, setFooterShowSocial] = useState(true)
  const [footerShowPoweredBy, setFooterShowPoweredBy] = useState(true)
  const [socialFacebook, setSocialFacebook] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [socialTwitter, setSocialTwitter] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [socialLinkedin, setSocialLinkedin] = useState('')
  const [socialYoutube, setSocialYoutube] = useState('')

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      return
    }
    setLogoUploading(true)
    try {
      const user = storage.getUser()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || 'anon')
      formData.append('folder', 'logos')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setLogoUrl(data.url)
      toast.success('Logo uploaded!')
    } catch {
      toast.error('Failed to upload logo')
    }
    setLogoUploading(false)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setSidebarOpen(!mq.matches)
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches)
    mq.addEventListener('change', handler)

    // Load the provider's DRAFT (falls back to published content server-side).
    // Identity is resolved by the API from the auth session — never from localStorage.
    fetch(`${API_BASE}/api/mini-websites?mode=draft`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.hasUnpublishedChanges) setHasUnpublishedChanges(true)
        if (!data || data.error) return
        if (data.blocks && Array.isArray(data.blocks) && data.blocks.length > 0) {
          setBlocks(data.blocks)
        }
        if (data.templateId) setTemplateId(data.templateId)
        if (data.paletteId) setPaletteId(data.paletteId)
        if (data.fontPairId) setFontPairId(data.fontPairId)
        if (data.density) setDensity(data.density)
        if (data.customColors) setCustomColors(data.customColors)
        if (data.slug) setSlug(data.slug)
        if (data.is_published) setPublished(true)
        if (data.logoUrl || data.logo_url) setLogoUrl(data.logoUrl || data.logo_url)
        if (data.whatsappEnabled !== undefined) setWhatsappEnabled(data.whatsappEnabled)
        if (data.whatsappNumber !== undefined) setWhatsappNumber(data.whatsappNumber)
        if (data.footerBusinessName !== undefined) setFooterBusinessName(data.footerBusinessName)
        if (data.footerTagline !== undefined) setFooterTagline(data.footerTagline)
        if (data.footerShowSocial !== undefined) setFooterShowSocial(data.footerShowSocial)
        if (data.footerShowPoweredBy !== undefined) setFooterShowPoweredBy(data.footerShowPoweredBy)
        if (data.socialFacebook !== undefined) setSocialFacebook(data.socialFacebook)
        if (data.socialInstagram !== undefined) setSocialInstagram(data.socialInstagram)
        if (data.socialTwitter !== undefined) setSocialTwitter(data.socialTwitter)
        if (data.socialTiktok !== undefined) setSocialTiktok(data.socialTiktok)
        if (data.socialLinkedin !== undefined) setSocialLinkedin(data.socialLinkedin)
        if (data.socialYoutube !== undefined) setSocialYoutube(data.socialYoutube)
      })
      .catch(() => {})

    return () => mq.removeEventListener('change', handler)
  }, [])

  const [capabilities, setCapabilities] = useState<ProviderCapabilities>({
    has_products: false,
    music: false,
    hotel: false,
    gallery: false,
  })

  useEffect(() => {
    // Smart services sync: fetch from API first, then compute capabilities
    fetch('/api/provider/services', { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const apiServices = data?.services || []
        if (apiServices.length > 0) {
          storage.setServices(apiServices)
        }
        computeCapabilities(apiServices.length > 0 ? apiServices : storage.getServices())
      })
      .catch(() => {
        computeCapabilities(storage.getServices())
      })
  }, [])

  const computeCapabilities = (services: any[]) => {
    const products = storage.get('provider_products')
    const caps: ProviderCapabilities = {
      has_products: Array.isArray(products) && products.length > 0,
      music: false,
      hotel: false,
      gallery: false,
    }

    for (const cap of Object.keys(CATEGORY_CAPABILITIES)) {
      const keywords = CATEGORY_CAPABILITIES[cap]
      if (services.some((s: any) => keywords.some(k => (s.category || '').toLowerCase().includes(k.toLowerCase())))) {
        (caps as any)[cap] = true
      }
    }

    setCapabilities(caps)
    storage.set('provider_capabilities', caps)
    storage.set('provider_categories', [...new Set(services.map((s: any) => s.category).filter(Boolean))])

    // Seed the services block ONLY when the provider hasn't added any services to
    // it yet. Never overwrite manual edits — those edits are the provider's data.
    if (services.length > 0) {
      setBlocks(prev => prev.map(b => {
        if (b.sectionId !== 'services') return b
        const existing = (b.content?.services as any[]) || []
        const isUntouchedDefault =
          existing.length === 0 ||
          (existing.length === 1 && (!existing[0]?.title || existing[0]?.title === 'Service 1'))
        if (!isUntouchedDefault) return b
        const websiteServices = services
          .filter((s: any) => s.active !== false)
          .map((s: any) => ({
            title: s.name || s.title || 'Service',
            description: s.description || `${s.category || ''} service delivered with excellence`,
            price: s.price,
            duration: s.duration,
          }))
        return { ...b, content: { ...b.content, services: websiteServices.slice(0, 12) } }
      }))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const autosaveRef = useRef<ReturnType<typeof setInterval>>()
  const publishingRef = useRef(false)

  // Autosave DRAFT every 30s (not 3s — 3s hammered the DB and fought with publishing)
  useEffect(() => {
    setLastSaved(new Date())
    autosaveRef.current = setInterval(() => {
      latestHandleSave.current(true)
    }, 30_000)
    return () => clearInterval(autosaveRef.current)
  }, [blocks, templateId, paletteId, fontPairId, density])

  useEffect(() => {
    const tmpl = getTemplateById(templateId)
    if (!tmpl) return
    const desiredSections = tmpl.sections
    setBlocks(prev => {
      const existing = new Map(prev.map(b => [b.sectionId, b]))
      const reordered: Block[] = []
      let changed = false
      for (const sectionId of desiredSections) {
        if (existing.has(sectionId)) {
          reordered.push(existing.get(sectionId)!)
          existing.delete(sectionId)
        } else {
          const def = BUILDER_SECTIONS.find(s => s.id === sectionId)
          if (def) {
            reordered.push({ id: `${sectionId}-${Date.now()}`, sectionId, content: { ...def.defaultContent }, visible: true })
            changed = true
          }
        }
      }
      if (existing.size > 0) changed = true
      return changed ? reordered : prev
    })
  }, [templateId])

  // Autosave saves a DRAFT to the server (the published site is untouched).
  // Skips while publishing so the publish payload always wins.
  const handleSave = useCallback(async (isAuto = false) => {
    if (publishingRef.current) return
    if (!isAuto) setSaving(true)
    setLastSaved(new Date())
    try {
      const payload = { blocks, templateId, paletteId, fontPairId, density, customColors, logoUrl, whatsappEnabled, whatsappNumber, footerBusinessName, footerTagline, footerShowSocial, footerShowPoweredBy, socialFacebook, socialInstagram, socialTwitter, socialTiktok, socialLinkedin, socialYoutube }
      const res = await fetch(`${API_BASE}/api/mini-websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        if (res.status === 401) {
          if (!isAuto) toast.error('Session expired — sign in again to keep saving')
          return
        }
        throw new Error('Save failed')
      }
      setHasUnpublishedChanges(true)
    } catch {
      if (!isAuto) toast.error('Could not save changes — check your connection')
    } finally {
      if (!isAuto) setSaving(false)
    }
  }, [blocks, templateId, paletteId, fontPairId, density, customColors, logoUrl, whatsappEnabled, whatsappNumber, footerBusinessName, footerTagline, footerShowSocial, footerShowPoweredBy, socialFacebook, socialInstagram, socialTwitter, socialTiktok, socialLinkedin, socialYoutube])

  const latestHandleSave = useRef(handleSave)
  useEffect(() => {
    latestHandleSave.current = handleSave
  }, [handleSave])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      setBlocks(arrayMove(blocks, oldIndex, newIndex))
    }
  }

  const handlePublish = async () => {
    if (!slug.trim()) {
      toast.error('Please enter a slug')
      return
    }
    setPublishing(true)
    publishingRef.current = true
    try {
      const payload = { blocks, templateId, paletteId, fontPairId, density, customColors, slug, published: true, logoUrl, whatsappEnabled, whatsappNumber, footerBusinessName, footerTagline, footerShowSocial, footerShowPoweredBy, socialFacebook, socialInstagram, socialTwitter, socialTiktok, socialLinkedin, socialYoutube }
      const res = await fetch(`${API_BASE}/api/mini-websites/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Publish failed')
      }
      setPublished(true)
      setHasUnpublishedChanges(false)
      setShowConfetti(true)
      toast.success('Published successfully!')
      setTimeout(() => setShowConfetti(false), 5000)
      setShowPublishModal(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish')
    } finally {
      setPublishing(false)
      publishingRef.current = false
    }
  }

  const slugTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const checkSlug = useCallback((value: string) => {
    setSlug(value)
    if (value.length < 3) {
      setSlugAvailable(null)
      return
    }
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current)
    slugTimerRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(`${API_BASE}/api/mini-websites/check-slug?slug=${encodeURIComponent(value)}`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) { setSlugAvailable(null); return }
        const data = await res.json()
        setSlugAvailable(data.available)
      } catch {
        setSlugAvailable(null)
      }
    }, 400)
  }, [])

  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const generateAiSlug = useCallback(() => {
    const heroBlock = blocks.find(b => b.sectionId === 'hero')
    const title = String(heroBlock?.content?.title || '')
    if (!title) {
      toast.error('Add a business name in the Hero block first')
      return
    }
    const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 30)
    setSlug(autoSlug)
    checkSlug(autoSlug)
    toast.success('AI slug generated from your business name')
  }, [blocks, checkSlug])

  const generateAiTagline = useCallback(async () => {
    const heroBlock = blocks.find(b => b.sectionId === 'hero')
    const currentTitle = String(heroBlock?.content?.title || '')
    if (!currentTitle) {
      toast.error('Add a business name in the Hero block first')
      return
    }
    setAiLoading('tagline')
    try {
      const categories = (storage.get('provider_categories') || []).join(', ')
      const taglines = [
        `${currentTitle} — Where quality meets excellence`,
        `Your trusted partner in ${categories || 'quality services'}`,
        `Experience the best with ${currentTitle}`,
        `Crafting excellence, delivering results — ${currentTitle}`,
        `${currentTitle} — Built on trust, driven by quality`,
      ]
      const idx = Math.floor(Math.random() * taglines.length)
      setBlocks(prev => prev.map(b =>
        b.sectionId === 'hero' ? { ...b, content: { ...b.content, tagline: taglines[idx] } } : b
      ))
      toast.success('AI tagline generated!')
    } catch {
      toast.error('Could not generate tagline')
    }
    setAiLoading(null)
  }, [blocks, setBlocks])

  const generateAiAbout = useCallback(async () => {
    const heroBlock = blocks.find(b => b.sectionId === 'hero')
    const title = String(heroBlock?.content?.title || 'Your business')
    setAiLoading('about')
    try {
      const categories = (storage.get('provider_categories') || []).join(', ')
      const services = (storage.getServices() || []).map((s: any) => s.title || s.name).filter(Boolean).join(', ')
      const paragraphs = [
        `${title} is a leading provider of ${categories || 'professional services'} committed to delivering exceptional quality. With years of experience, we have built a reputation for reliability and excellence.`,
        `At ${title}, we specialize in ${services || 'providing top-notch solutions'} tailored to meet your unique needs. Our team of professionals is dedicated to ensuring your complete satisfaction.`,
      ]
      setBlocks(prev => prev.map(b =>
        b.sectionId === 'about' ? { ...b, content: { ...b.content, content: paragraphs.join(' ') } } : b
      ))
      toast.success('AI about section generated!')
    } catch {
      toast.error('Could not generate content')
    }
    setAiLoading(null)
  }, [blocks, setBlocks])

  const generateAiServices = useCallback(async () => {
    setAiLoading('services')
    try {
      let services: Array<{ title: string; description: string }> = []
      try {
        const res = await fetch('/api/provider/services', { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const data = await res.json()
          services = (data?.services || [])
            .filter((s: any) => s.active !== false)
            .map((s: any) => ({
              title: s.name || s.title || s.category || 'Service',
              description: s.description || `${s.name || s.category} - delivered with excellence`,
            }))
          if (services.length > 0) storage.setServices(data.services)
        }
      } catch {}
      if (services.length === 0) {
        const localServices = storage.getServices()
        services = localServices.map((s: any) => ({
          title: s.name || s.title || s.category || 'Service',
          description: s.description || `${s.name || s.category} - delivered with excellence`,
        }))
      }
      if (services.length === 0) {
        services.push(
          { title: 'Consultation', description: 'Expert advice tailored to your needs' },
          { title: 'Premium Service', description: 'Top-quality service delivery' },
          { title: 'Support', description: '24/7 customer support and assistance' }
        )
      }
      setBlocks(prev => prev.map(b =>
        b.sectionId === 'services' ? { ...b, content: { ...b.content, services: services.slice(0, 8) } } : b
      ))
      toast.success(`Populated ${services.length} services from your profile!`)
    } catch {
      toast.error('Could not generate services')
    }
    setAiLoading(null)
  }, [setBlocks])

  const currentTemplate = getTemplateById(templateId) ?? DEFAULT_TEMPLATE
  const palette = paletteId === 'custom' && customColors
    ? [customColors.primary, customColors.background, customColors.accent]
    : (getAllPalettes().find(p => p.name === paletteId)?.colors ?? DEFAULT_PALETTE.colors)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-white/10 bg-gray-900/50 backdrop-blur gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Toggle sidebar"
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              title="Mobile (375px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'tablet' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              title="Tablet (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              title="Desktop (1024px)"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden sm:block h-4 w-px bg-white/10 shrink-0" />
          <select
            value={density}
            onChange={e => setDensity(e.target.value as Density)}
            className="hidden sm:block bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shrink-0"
          >
            <option value="compact" className="bg-gray-800">Compact</option>
            <option value="comfortable" className="bg-gray-800">Comfortable</option>
            <option value="spacious" className="bg-gray-800">Spacious</option>
          </select>
          {hasUnpublishedChanges && (
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg shrink-0" title="Your latest changes are saved as a draft. Publish to make them live.">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unpublished changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastSaved && (
            <span className="hidden sm:inline text-xs text-white/50">
              {saving ? 'Saving...' : `Saved ${Math.round((Date.now() - lastSaved.getTime()) / 1000)}s ago`}
            </span>
          )}
          <Button onClick={() => handleSave(false)} variant="outline" size="sm">
            <Save className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button onClick={() => setShowPublishModal(true)} variant="default" size="sm">
            <Send className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">{published ? 'Update' : 'Publish'}</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative min-w-0">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 absolute lg:relative z-40 lg:z-auto inset-y-0 left-0 w-72 border-r border-white/10 overflow-y-auto bg-gray-900/30 transition-transform duration-300 ease-in-out`}>
          <div className="flex border-b border-white/10">
            {[
              { id: 'blocks', label: 'Blocks', icon: '⧉' },
              { id: 'template', label: 'Template', icon: '◻' },
              { id: 'palette', label: 'Colors', icon: '🎨' },
              { id: 'fonts', label: 'Fonts', icon: 'Aa' },
              { id: 'ai', label: 'AI Tools', icon: '✨' },
              { id: 'settings', label: 'Settings', icon: '⚙' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
                  selectedTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-3">
            {selectedTab === 'blocks' && (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-xs font-medium text-white/80 mb-2">Website Logo</h4>
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-white/5 border border-dashed border-white/30 rounded-lg text-xs text-white/60 hover:border-blue-400/50 hover:text-blue-300 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  </label>
                  {logoUrl && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <img src={logoUrl} alt="Logo" className="h-8 w-auto max-w-[80px] object-contain rounded" />
                      <button onClick={() => setLogoUrl('')} className="text-red-400 hover:text-red-300 text-[10px] ml-auto">Remove</button>
                    </div>
                  )}
                </div>
                <BlockEditor blocks={blocks} onChange={setBlocks} capabilities={capabilities} />
              </div>
            )}
            {selectedTab === 'template' && (
              <TemplateGallery selectedTemplate={templateId} onChange={setTemplateId} />
            )}
            {selectedTab === 'palette' && (
              <PalettePicker selectedPalette={paletteId} customColors={customColors} onChange={(name, custom) => {
                setPaletteId(name)
                if (custom) setCustomColors(custom)
              }} />
            )}
            {selectedTab === 'fonts' && (
              <FontPairPicker selectedFontPair={fontPairId} onChange={setFontPairId} />
            )}
            {selectedTab === 'ai' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-white/55">Let AI help you build a professional website faster.</p>

                <button
                  onClick={generateAiSlug}
                  disabled={!blocks.find(b => b.sectionId === 'hero')?.content?.title}
                  className="w-full text-left p-3 bg-gradient-to-r from-violet-500/30 to-purple-500/30 border border-violet-500/40 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <div>
                      <p className="text-xs font-medium text-white">Generate Slug</p>
                      <p className="text-[10px] text-white/55">Auto-create from your business name</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={generateAiTagline}
                  disabled={aiLoading === 'tagline'}
                  className="w-full text-left p-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-500/40 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-40"
                >
                  <div className="flex items-center gap-2">
                    {aiLoading === 'tagline' ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <span className="text-base">💬</span>}
                    <div>
                      <p className="text-xs font-medium text-white">AI Tagline</p>
                      <p className="text-[10px] text-white/55">Auto-generate catchy hero tagline</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={generateAiAbout}
                  disabled={aiLoading === 'about'}
                  className="w-full text-left p-3 bg-gradient-to-r from-emerald-500/30 to-green-500/30 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  <div className="flex items-center gap-2">
                    {aiLoading === 'about' ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <span className="text-base">📝</span>}
                    <div>
                      <p className="text-xs font-medium text-white">AI About Section</p>
                      <p className="text-[10px] text-white/55">Auto-generate business description</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={generateAiServices}
                  disabled={aiLoading === 'services'}
                  className="w-full text-left p-3 bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-40"
                >
                  <div className="flex items-center gap-2">
                    {aiLoading === 'services' ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> : <span className="text-base">🔧</span>}
                    <div>
                      <p className="text-xs font-medium text-white">AI Services</p>
                      <p className="text-[10px] text-white/55">Auto-populate from your service profile</p>
                    </div>
                  </div>
                </button>

                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs font-medium text-white/60 mb-2">SEO Tips</h4>
                  <ul className="space-y-1">
                    <li className="text-[10px] text-white/55">• Use a short, memorable slug</li>
                    <li className="text-[10px] text-white/55">• Keep your tagline under 10 words</li>
                    <li className="text-[10px] text-white/55">• Add your real business name in the Hero</li>
                    <li className="text-[10px] text-white/55">• Use clear service titles for better SEO</li>
                  </ul>
                </div>
              </div>
            )}
            {selectedTab === 'settings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">WhatsApp Integration</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">Enable WhatsApp button</p>
                    <p className="text-[10px] text-white/55">Show floating WhatsApp chat button</p>
                  </div>
                  <button
                    onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${whatsappEnabled ? 'bg-green-500' : 'bg-white/30'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${whatsappEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {whatsappEnabled && (
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">WhatsApp Phone Number</label>
                    <input
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      placeholder="+2348012345678"
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                    />
                    <p className="text-[10px] text-white/55 mt-1">Include country code (e.g. +234)</p>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Footer Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/70 mb-1 block">Business Name in Footer</label>
                      <input
                        value={footerBusinessName}
                        onChange={e => setFooterBusinessName(e.target.value)}
                        placeholder="Your Business Name"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 block">Footer Tagline</label>
                      <input
                        value={footerTagline}
                        onChange={e => setFooterTagline(e.target.value)}
                        placeholder="Professional services you can trust"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/80">Show social links</p>
                      <button
                        onClick={() => setFooterShowSocial(!footerShowSocial)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${footerShowSocial ? 'bg-blue-500' : 'bg-white/30'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${footerShowSocial ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/80">Show &quot;Powered by Bixfind&quot;</p>
                      <button
                        onClick={() => setFooterShowPoweredBy(!footerShowPoweredBy)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${footerShowPoweredBy ? 'bg-blue-500' : 'bg-white/30'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${footerShowPoweredBy ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-1">Social Media Links</h3>
                  <p className="text-[10px] text-white/55 mb-3">Add your social media profiles to show in the footer</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </label>
                      <input
                        value={socialFacebook}
                        onChange={e => setSocialFacebook(e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </label>
                      <input
                        value={socialInstagram}
                        onChange={e => setSocialInstagram(e.target.value)}
                        placeholder="https://instagram.com/yourprofile"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X / Twitter
                      </label>
                      <input
                        value={socialTwitter}
                        onChange={e => setSocialTwitter(e.target.value)}
                        placeholder="https://x.com/yourhandle"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                        TikTok
                      </label>
                      <input
                        value={socialTiktok}
                        onChange={e => setSocialTiktok(e.target.value)}
                        placeholder="https://tiktok.com/@yourprofile"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </label>
                      <input
                        value={socialLinkedin}
                        onChange={e => setSocialLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/company/yourpage"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/70 mb-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube
                      </label>
                      <input
                        value={socialYoutube}
                        onChange={e => setSocialYoutube(e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-white/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-800 to-gray-900 p-4 flex justify-center">
          <div className={`transition-all duration-300 ${
            previewMode === 'mobile' ? 'w-[375px]' :
            previewMode === 'tablet' ? 'w-[768px]' :
            'w-full max-w-5xl'
          }`}>
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className={`${previewMode === 'mobile' ? 'p-3' : 'p-4'} ${
                density === 'compact' ? 'space-y-3' :
                density === 'spacious' ? 'space-y-6' :
                'space-y-4'
              }`}>
                {blocks.filter(b => b.visible).map(block => (
                  <PreviewBlock key={block.id} block={block} palette={palette} density={density} template={currentTemplate} previewMode={previewMode} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <Confetti active={showConfetti} config={{ spread: 120, startVelocity: 30, elementCount: 200, decay: 0.95 }} />
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Publish Your Website</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Website Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/55 shrink-0">bixfind.indevs.in/p/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => checkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-business"
                    className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                {slug.length >= 3 && (
                  <p className={`text-xs mt-1 ${slugAvailable ? 'text-green-400' : slugAvailable === false ? 'text-red-400' : 'text-yellow-400'}`}>
                    {slugAvailable === null ? 'Checking...' : slugAvailable ? 'Available!' : 'Taken'}
                  </p>
                )}
                {slug.length > 0 && slug.length < 3 && (
                  <p className="text-xs mt-1 text-white/50">Minimum 3 characters</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePublish}
                  disabled={publishing || slugAvailable === false || slug.length < 3}
                  className="flex-1"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  {publishing ? 'Publishing...' : 'Publish Now'}
                </Button>
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>Cancel</Button>
              </div>
              {published && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(`https://bixfind.indevs.in/p/${slug}`); toast.success('Link copied!') }}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my website: https://bixfind.indevs.in/p/${slug}`)}`, '_blank')}
                  >
                    <Share2 className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

    </div>
  )
}

function PreviewBlock({ block, palette, density, template, previewMode }: { block: Block; palette: string[]; density: Density; template?: TemplateConfig; previewMode?: string }) {
  const primary = palette[0] ?? '#0066FF'
  const bg = palette[1] ?? '#FFFFFF'
  const accent = palette[2] ?? '#00D4AA'

  const padding = density === 'compact' ? 'p-4' : density === 'spacious' ? 'p-6' : 'p-5'
  const titleSize = density === 'compact' ? 'text-xl' : density === 'spacious' ? 'text-3xl' : 'text-2xl'
  const radius = template?.borderRadius === 'none' ? 'rounded-none' : template?.borderRadius === 'sm' ? 'rounded-sm' : template?.borderRadius === 'md' ? 'rounded-md' : template?.borderRadius === 'lg' ? 'rounded-lg' : template?.borderRadius === 'xl' ? 'rounded-xl' : template?.borderRadius === 'full' ? 'rounded-2xl' : 'rounded-lg'
  const cardCls = template?.cardStyle === 'glass' ? 'backdrop-blur-md bg-white/10 border border-white/20' : template?.cardStyle === 'bordered' ? 'border-2 border-gray-200' : template?.cardStyle === 'elevated' ? 'shadow-xl' : template?.cardStyle === 'minimal' ? 'bg-transparent' : 'bg-white/90'
  const bgImage = block.content.backgroundType === 'image' && block.content.backgroundImage ? String(block.content.backgroundImage) : null

  const heroClasses = template?.heroLayout === 'fullscreen' ? 'min-h-[50vh] flex items-center justify-center' : template?.heroLayout === 'left' ? 'text-left' : template?.heroLayout === 'right' ? 'text-right' : template?.heroLayout === 'split' ? 'grid grid-cols-2 items-center' : template?.heroLayout === 'minimal' ? 'py-8' : 'text-center'
  const titleAlign = template?.heroLayout === 'left' ? 'text-left' : template?.heroLayout === 'right' ? 'text-right' : 'text-center'

  switch (block.sectionId) {
    case 'hero':
      return (
        <div className={`${padding} ${heroClasses} ${radius} relative overflow-hidden`}
          style={{
            background: bgImage
              ? `url(${bgImage}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primary}, ${accent})`,
          }}>
          {bgImage && <div className="absolute inset-0 bg-black/40" />}
          <div className={`relative z-10 ${template?.heroLayout === 'split' ? '' : 'max-w-2xl mx-auto'}`}>
            <h1 className={`${titleSize} font-bold ${template?.heroLayout === 'split' ? '' : titleAlign === 'text-center' ? 'text-center' : ''} text-white`}>
              {String(block.content.title || 'Welcome')}
            </h1>
            <p className={`text-white/80 mt-2 ${titleAlign === 'text-center' ? 'text-center' : ''}`}>
              {String(block.content.tagline || '')}
            </p>
            <button className={`mt-4 px-6 py-2 bg-white text-gray-900 font-semibold text-sm ${radius}`}>
              {String(block.content.ctaText || 'Get Started')}
            </button>
          </div>
        </div>
      )
    case 'about':
      return (
        <div className={`${padding} ${cardCls} ${radius}`}>
          <h2 className={`${titleSize} font-bold ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'} mb-2`}>About</h2>
          <p className={`text-sm ${template?.cardStyle === 'glass' ? 'text-white/70' : 'text-gray-600'}`}>{String(block.content.content || '').substring(0, 200)}</p>
        </div>
      )
    case 'services':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3`}>Services</h2>
          <div className={`grid ${previewMode === 'mobile' ? 'grid-cols-1' : previewMode === 'tablet' ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
            {(block.content.services as Array<{ title: string }>)?.slice(0, previewMode === 'mobile' ? 3 : 4).map((s, i) => (
              <div key={i} className={`p-3 ${cardCls} ${radius}`}>
                <p className={`font-semibold text-sm ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'}`}>{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'contact':
      return (
        <div className={`${padding} ${cardCls} ${radius}`}>
          <h2 className={`${titleSize} font-bold ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'} mb-3`}>Contact</h2>
          <div className={`space-y-2 text-sm ${template?.cardStyle === 'glass' ? 'text-white/70' : 'text-gray-600'}`}>
            {block.content.email && <p>Email: {String(block.content.email)}</p>}
            {block.content.phone && <p>Phone: {String(block.content.phone)}</p>}
            {block.content.address && <p>Address: {String(block.content.address)}</p>}
          </div>
        </div>
      )
    case 'gallery':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3`}>Gallery</h2>
          <div className={`grid ${
            previewMode === 'mobile' ? 'grid-cols-2' :
            previewMode === 'tablet' ? 'grid-cols-3' :
            'grid-cols-3'
          } gap-2`}>
            {(block.content.images as string[])?.slice(0, previewMode === 'mobile' ? 4 : 3).map((img, i) => (
              <div key={i} className={`aspect-square bg-gray-200 ${radius} overflow-hidden`}>
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
              </div>
            ))}
            {(!(block.content.images as string[])?.length) && (
              <p className="text-gray-400 text-sm col-span-full">No images added</p>
            )}
          </div>
        </div>
      )
    case 'music':
      return (
        <div className={`${padding} ${cardCls} ${radius}`} style={template?.cardStyle !== 'glass' ? { background: `linear-gradient(135deg, ${primary}22, ${accent}22)` } : {}}>
          <h2 className={`${titleSize} font-bold ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center gap-2`}>
            <Music className="w-5 h-5" style={{ color: primary }} /> Music
          </h2>
          <div className="space-y-2">
            {((block.content.tracks as Array<{ title: string; artist?: string }>)?.slice(0, previewMode === 'mobile' ? 2 : 4) ?? []).map((t, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 bg-white/60 ${radius}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: primary }}>
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{t.title}</p>
                  {t.artist && <p className="text-xs text-gray-500">{t.artist}</p>}
                </div>
              </div>
            ))}
            {(!(block.content.tracks as any[])?.length) && (
              <div className={`flex items-center justify-center h-16 bg-white/40 ${radius}`}>
                <p className="text-gray-400 text-sm">No tracks added</p>
              </div>
            )}
          </div>
        </div>
      )
    case 'products':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <ShoppingBag className="w-5 h-5" style={{ color: primary }} /> Products
          </h2>
          <div className={`grid ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {((block.content.products as Array<{ name: string; price?: number }>)?.slice(0, previewMode === 'mobile' ? 2 : 4) ?? []).map((p, i) => (
              <div key={i} className={`p-3 ${cardCls} ${radius}`}>
                <div className={`aspect-square bg-gray-200 ${radius} mb-2`} />
                <p className={`font-semibold text-sm ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                {p.price != null && <p className="text-sm font-medium" style={{ color: primary }}>&#8358;{p.price.toLocaleString()}</p>}
              </div>
            ))}
            {(!(block.content.products as any[])?.length) && (
              <p className="text-gray-400 text-sm col-span-full">No products added</p>
            )}
          </div>
        </div>
      )
    case 'hotel':
      return (
        <div className={`${padding} ${cardCls} ${radius}`} style={template?.cardStyle !== 'glass' ? { background: `linear-gradient(135deg, ${primary}15, ${accent}15)` } : {}}>
          <h2 className={`${titleSize} font-bold ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center gap-2`}>
            <Hotel className="w-5 h-5" style={{ color: primary }} /> Hotel
          </h2>
          <div className={`grid ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {((block.content.rooms as Array<{ name: string; price?: number }>)?.slice(0, previewMode === 'mobile' ? 2 : 4) ?? []).map((r, i) => (
              <div key={i} className={`p-3 bg-white/60 ${radius}`}>
                <div className={`aspect-video bg-gray-200 ${radius} mb-2`} />
                <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                {r.price != null && <p className="text-sm font-medium" style={{ color: primary }}>&#8358;{r.price.toLocaleString()}/night</p>}
              </div>
            ))}
            {(!(block.content.rooms as any[])?.length) && (
              <p className="text-gray-400 text-sm col-span-2">No rooms added</p>
            )}
          </div>
          {(block.content.amenities as string[])?.length ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {(block.content.amenities as string[]).slice(0, 6).map((a, i) => (
                <span key={i} className={`px-2 py-1 bg-white/50 ${radius} text-xs text-gray-700`}>{a}</span>
              ))}
            </div>
          ) : null}
        </div>
      )
    case 'testimonials':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <MessageSquare className="w-5 h-5" style={{ color: primary }} /> Testimonials
          </h2>
          <div className="space-y-3">
            {((block.content.testimonials as Array<{ name: string; text?: string; rating?: number }>)?.slice(0, 3) ?? []).map((t, i) => (
              <div key={i} className={`p-4 ${cardCls} ${radius} border`} style={{ borderColor: `${primary}22` }}>
                {t.rating && (
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} className={`text-sm ${si < t.rating! ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</span>
                    ))}
                  </div>
                )}
                <p className={`text-sm italic ${template?.cardStyle === 'glass' ? 'text-white/80' : 'text-gray-600'}`}>&quot;{t.text || 'Great service!'}&quot;</p>
                <p className={`text-xs font-semibold ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'} mt-2`}>- {t.name}</p>
              </div>
            ))}
            {(!(block.content.testimonials as any[])?.length) && (
              <p className="text-gray-400 text-sm">No testimonials added</p>
            )}
          </div>
        </div>
      )
    case 'pricing':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <CreditCard className="w-5 h-5" style={{ color: primary }} /> Pricing
          </h2>
          <div className={`grid ${
            previewMode === 'mobile' ? 'grid-cols-1' :
            previewMode === 'tablet' ? 'grid-cols-2' :
            'grid-cols-3'
          } gap-3`}>
            {((block.content.plans as Array<{ name: string; price?: number; features?: string[] }>)?.slice(0, previewMode === 'mobile' ? 2 : 3) ?? []).map((p, i) => (
              <div key={i} className={`p-4 ${radius} border text-center ${i === 1 ? 'border-transparent text-white' : cardCls}`} style={i === 1 ? { background: primary } : {}}>
                <p className={`font-semibold text-sm ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                {p.price != null && (
                  <p className={`text-2xl font-bold mt-2 ${i === 1 ? 'text-white' : 'text-gray-900'}`}>&#8358;{p.price.toLocaleString()}</p>
                )}
                {p.features?.length ? (
                  <ul className="mt-3 space-y-1">
                    {p.features.slice(0, 3).map((f, fi) => (
                      <li key={fi} className={`text-xs ${i === 1 ? 'text-white/80' : 'text-gray-500'}`}>&#10003; {f}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {(!(block.content.plans as any[])?.length) && (
              <p className="text-gray-400 text-sm col-span-3">No plans added</p>
            )}
          </div>
        </div>
      )
    case 'faq':
      return (
        <div className={padding}>
          <h2 className={`${titleSize} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <HelpCircle className="w-5 h-5" style={{ color: primary }} /> FAQ
          </h2>
          <div className="space-y-2">
            {((block.content.questions as Array<{ question: string; answer?: string }>)?.slice(0, 4) ?? []).map((q, i) => (
              <div key={i} className={`p-3 ${cardCls} ${radius}`}>
                <p className={`font-semibold text-sm ${template?.cardStyle === 'glass' ? 'text-white' : 'text-gray-900'}`}>{q.question}</p>
                {q.answer && <p className={`text-xs mt-1 ${template?.cardStyle === 'glass' ? 'text-white/60' : 'text-gray-500'}`}>{q.answer}</p>}
              </div>
            ))}
            {(!(block.content.questions as any[])?.length) && (
              <p className="text-gray-400 text-sm">No questions added</p>
            )}
          </div>
        </div>
      )
    default:
      return (
        <div className={padding}>
          <p className="text-gray-400 text-sm">Section: {block.sectionId}</p>
        </div>
      )
  }
}
