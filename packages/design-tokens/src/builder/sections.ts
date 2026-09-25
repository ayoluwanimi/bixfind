export interface BuilderSection {
  id: string
  label: string
  icon: string
  always: boolean
  requires?: string
  description: string
  defaultContent: Record<string, unknown>
}

export const BUILDER_SECTIONS: BuilderSection[] = [
  {
    id: 'hero',
    label: 'Hero',
    icon: 'Image',
    always: true,
    description: 'Main banner with title, tagline, and CTA',
    defaultContent: { title: 'Welcome', tagline: 'Your tagline here', ctaText: 'Get Started', ctaLink: '#', backgroundType: 'color', backgroundImage: '' },
  },
  {
    id: 'about',
    label: 'About',
    icon: 'Info',
    always: true,
    description: 'Tell your story and introduce your brand',
    defaultContent: { content: 'About your business...', image: '' },
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'Briefcase',
    always: true,
    description: 'List your services with descriptions',
    defaultContent: { services: [{ title: 'Service 1', description: 'Description...' }] },
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'ShoppingBag',
    always: false,
    requires: 'has_products',
    description: 'Showcase your products with prices',
    defaultContent: { products: [] },
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: 'ImagePlus',
    always: true,
    description: 'Image and video gallery',
    defaultContent: { images: [], videos: [] },
  },
  {
    id: 'music',
    label: 'Music',
    icon: 'Music',
    always: false,
    requires: 'music',
    description: 'Audio player and track listing',
    defaultContent: { tracks: [] },
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: 'Hotel',
    always: false,
    requires: 'hotel',
    description: 'Rooms, amenities, and booking',
    defaultContent: { rooms: [], amenities: [], checkinTime: '14:00', checkoutTime: '12:00' },
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'Phone',
    always: true,
    description: 'Contact form and business details',
    defaultContent: { email: '', phone: '', address: '', formEnabled: true },
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: 'MessageSquare',
    always: true,
    description: 'Client reviews and testimonials',
    defaultContent: { testimonials: [] },
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: 'CreditCard',
    always: true,
    description: 'Pricing tables and plans',
    defaultContent: { plans: [] },
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: 'HelpCircle',
    always: true,
    description: 'Frequently asked questions',
    defaultContent: { questions: [] },
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: 'Search',
    always: true,
    description: 'SEO meta tags and OG image settings',
    defaultContent: { title: '', description: '', keywords: '', ogImage: '' },
  },
]

export function getVisibleSections(capabilities: Record<string, boolean>): BuilderSection[] {
  return BUILDER_SECTIONS.filter(s => s.always || (s.requires && capabilities[s.requires]))
}

export function getSectionById(id: string): BuilderSection | undefined {
  return BUILDER_SECTIONS.find(s => s.id === id)
}
