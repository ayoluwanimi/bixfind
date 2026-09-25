'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Phone, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import AuthAwareNav from '../../../components/AuthAwareNav'

export default function Support() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        { q: 'How do I create an account?', a: 'Go to Sign Up, fill in your details, verify your email, and you\'re ready to go!' },
        { q: 'What\'s the difference between customer and provider accounts?', a: 'Customers find and book services. Providers offer and manage services.' },
        { q: 'Is there a sign-up fee?', a: 'No, creating an account is completely free!' },
      ]
    },
    {
      category: 'Using Bixfind',
      items: [
        { q: 'How do I find services?', a: 'Use the search bar, browse categories, or filter by location and rating.' },
        { q: 'How do I book a service?', a: 'Select a service, choose your date/time, and complete payment.' },
        { q: 'Can I cancel a booking?', a: 'Yes, you can cancel up to 24 hours before the service.' },
      ]
    },
    {
      category: 'For Providers',
      items: [
        { q: 'How do I start offering services?', a: 'Sign up as a provider, complete verification, and list your first service.' },
        { q: 'What commission does Bixfind take?', a: 'We take 15% commission on completed services.' },
        { q: 'How do I get paid?', a: 'Payments are transferred to your wallet weekly. You can withdraw anytime.' },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <AuthAwareNav currentPath="#" />

      <motion.section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-20 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-4">Support & Help</h1>
          <p className="text-xl text-blue-100">We're here to help. Choose your preferred way to reach us.</p>
        </motion.div>
      </motion.section>

      <motion.section className="max-w-6xl mx-auto px-4 py-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Get Help Now</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <motion.a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="bg-white rounded-lg shadow p-8 text-center hover:shadow-lg transition cursor-pointer" whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <motion.div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" whileHover={{ rotate: 10, scale: 1.1 }}>
              <MessageCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-600 mb-4">Chat with our support team instantly on WhatsApp</p>
            <p className="text-green-600 font-semibold">+1 (555) 123-4567</p>
          </motion.a>
          <motion.a href="https://t.me/bixfind_support" target="_blank" rel="noopener noreferrer" className="bg-white rounded-lg shadow p-8 text-center hover:shadow-lg transition cursor-pointer" whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <motion.div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4" whileHover={{ rotate: 10, scale: 1.1 }}>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Telegram</h3>
            <p className="text-gray-600 mb-4">Join our Telegram group for instant support</p>
            <p className="text-blue-600 font-semibold">@bixfind_support</p>
          </motion.a>
          <motion.a href="mailto:support@bixfind.indevs.in" className="bg-white rounded-lg shadow p-8 text-center hover:shadow-lg transition cursor-pointer" whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <motion.div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4" whileHover={{ rotate: 10, scale: 1.1 }}>
              <Phone className="w-8 h-8 text-purple-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Send us an email and we'll respond within 24 hours</p>
            <p className="text-purple-600 font-semibold">support@bixfind.indevs.in</p>
          </motion.a>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-12">
          <p className="text-gray-700"><span className="font-semibold">⚡ Response Times:</span> WhatsApp: 5 mins | Telegram: 15 mins | Email: 24 hours</p>
        </div>
      </motion.section>

      <motion.section className="bg-gray-50 py-20 px-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map((section, sectionIdx) => (
              <motion.div key={sectionIdx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: sectionIdx * 0.1, duration: 0.4 }}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{section.category}</h3>
                <div className="space-y-3">
                  {section.items.map((item, itemIdx) => {
                    const id = `${sectionIdx}-${itemIdx}`
                    const isExpanded = expandedFaq === id
                    return (
                      <motion.div key={id} className="bg-white rounded-lg border border-gray-200" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: (sectionIdx * 3 + itemIdx) * 0.05, duration: 0.3 }} whileHover={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <button onClick={() => setExpandedFaq(isExpanded ? null : id)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition">
                          <h4 className="text-left font-semibold text-gray-900">{item.q}</h4>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          </motion.div>
                        </button>
                        {isExpanded && (
                          <motion.div className="px-6 pb-6 text-gray-600 border-t border-gray-200" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                            {item.a}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="max-w-4xl mx-auto px-4 py-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <motion.div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200" whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need to Create a Support Ticket?</h2>
          <p className="text-gray-600 mb-6">For complex issues or detailed inquiries, open a support ticket and our team will help you step by step.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">Open Support Ticket</Link>
          </motion.div>
        </motion.div>
      </motion.section>

      <footer className="bg-gray-900 text-white py-12 px-4 mt-20">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 Bixfind. Find Every Service, Every Provider, Everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
