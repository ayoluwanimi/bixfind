'use client'

import { motion } from 'framer-motion'
import { Shield, Star, Calendar, Headphones } from 'lucide-react'

const features = [
  { icon: Shield, title: 'Trusted Providers', description: 'All service providers are verified and vetted' },
  { icon: Star, title: 'Verified Reviews', description: 'Real reviews from real customers' },
  { icon: Calendar, title: 'Easy Booking', description: 'Book services in just a few clicks' },
  { icon: Headphones, title: '24/7 Support', description: "We're here to help anytime" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] animate-pulse animation-delay-2000" />
        <div className="w-full max-w-lg xl:max-w-xl relative z-10">
          {children}
        </div>
      </div>
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse animation-delay-4000" />
        <motion.div
          className="relative z-10 text-center max-w-md"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="mx-auto mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <img src="/logo.png" alt="Bixfind Logo" className="h-20 w-20" />
          </motion.div>
          <motion.h2
            className="text-4xl font-bold text-white mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            BIXFIND
          </motion.h2>
          <motion.p
            className="text-lg text-blue-200/80 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            Find trusted local services near you
          </motion.p>
          <div className="space-y-6 text-left mb-12">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex items-start gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.5 }}
              >
                <div className="w-10 h-10 bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                  <feature.icon className="w-5 h-5 text-blue-300/80" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-sm text-blue-200/50">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="p-6 bg-white/[0.03] rounded-2xl border border-white/[0.06]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <p className="text-blue-200/70 text-sm italic leading-relaxed">
              &ldquo;Bixfind made it so easy to find a plumber near me. The whole process was seamless from booking to completion. Highly recommended!&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                SM
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">Sarah M.</p>
                <p className="text-blue-200/40 text-xs">Verified Customer</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
