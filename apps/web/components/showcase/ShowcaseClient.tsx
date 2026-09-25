'use client'

import dynamic from 'next/dynamic'

// Client-only: three.js/R3F and the WebGL glass container must never enter
// the server-render graph — prerendering them crashes the build (duplicate
// React instances inside the reconciler). ssr:false keeps them browser-only.
const ProductShowcase = dynamic(() => import('./ProductShowcase'), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

const GlassPanel = dynamic(() => import('./GlassPanel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-gradient-to-br from-blue-100/60 to-purple-100/60 border border-gray-200" style={{ minHeight: 180 }} />
  ),
})

export { ProductShowcase, GlassPanel }
