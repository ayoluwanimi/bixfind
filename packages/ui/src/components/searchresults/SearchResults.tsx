"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "../../lib/utils"
import type { ProviderCard } from "@bixfind/validation"
import { ProviderCard as ProviderCardComponent } from "../providercard/ProviderCard"

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
}

interface SearchResultsProps {
  results?: ProviderCard[]
  loading?: boolean
  error?: string | null
  onItemClick?: (item: ProviderCard) => void
  totalCount?: number
  aiSummary?: string
  className?: string
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="h-3 w-12 rounded bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
    </div>
  )
}

function EmptyState({ query }: { query?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white/80 mb-2">
        {query ? `No results for "${query}"` : "Search providers"}
      </h3>
      <p className="text-sm text-white/40 max-w-md mb-6">
        Try different keywords, browse categories, or check out what others are looking for.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {["Plumber", "Electrician", "Painter", "Barber", "Catering", "Fashion"].map((s) => (
          <span
            key={s}
            className="px-3 py-1.5 rounded-full text-sm bg-white/10 text-white/60 border border-white/10"
          >
            {s}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export function SearchResults({
  results,
  loading = false,
  error,
  onItemClick,
  aiSummary,
  className,
}: SearchResultsProps) {
  const isEmpty = !loading && !error && (!results || results.length === 0)
  const isFirstLoad = loading && !results

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  return (
    <div className={cn("w-full", className)}>
      {aiSummary && !loading && results && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 mb-4 px-1"
        >
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/60">{aiSummary}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {isFirstLoad && (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {skeletons.map((i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        )}

        {isEmpty && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState />
          </motion.div>
        )}

        {results && results.length > 0 && !loading && (
          <motion.div
            key="results"
            variants={stagger}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence>
              {results.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  layout
                >
                  <ProviderCardComponent
                    provider={item}
                    onClick={() => onItemClick?.(item)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {loading && results && results.length > 0 && (
          <motion.div
            key="loading-more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-6"
          >
            <div className="flex items-center gap-2 text-sm text-white/40">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              Loading more...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
