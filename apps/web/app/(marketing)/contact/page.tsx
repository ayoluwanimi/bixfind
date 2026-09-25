'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react'
import AuthAwareNav from '../../../components/AuthAwareNav'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          message: form.message,
          userName: form.name,
          userEmail: form.email,
          userPhone: form.phone || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmitted(true)
        setForm({ name: '', email: '', subject: '', message: '', phone: '' })
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        setError(json.error || 'Failed to submit')
      }
    } catch {
      setError('Network error. Please try email: support@bixfind.indevs.in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthAwareNav currentPath="/contact" />

      <motion.section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-20 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100">We'd love to hear from you. Get in touch with our team.</p>
        </motion.div>
      </motion.section>

      <motion.section className="max-w-6xl mx-auto px-4 py-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div className="space-y-8" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            {[
              { icon: <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />, title: 'Email', lines: ['support@bixfind.indevs.in', 'We reply within 24 hours'] },
              { icon: <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />, title: 'Phone', lines: ['+234 800 BIXFIND', 'Mon-Fri, 9AM-6PM WAT'] },
              { icon: <MessageCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />, title: 'WhatsApp', lines: ['Chat with us instantly', 'Typically replies in 5 minutes'] },
              { icon: <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />, title: 'Office', lines: ['Lagos, Nigeria', 'Support available nationwide'] },
            ].map((item, idx) => (
              <motion.div key={idx} className="flex gap-4" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 + 0.3, duration: 0.4 }} whileHover={{ x: 5 }}>
                {item.icon}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  {item.lines.map((line, i) => (<p key={i} className="text-gray-600">{line}</p>))}
                </div>
              </motion.div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">Need immediate help?</p>
              <p className="text-sm text-amber-700 mt-1">Email <strong>support@bixfind.indevs.in</strong> or submit a ticket below and we'll get back to you promptly.</p>
            </div>
          </motion.div>

          <motion.div className="bg-gray-50 rounded-lg p-8" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            {submitted && (
              <motion.div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CheckCircle2 className="w-5 h-5" />
                Ticket submitted! We'll get back to you soon.
              </motion.div>
            )}
            {error && (
              <motion.div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error}
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+234 800 000 0000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us your thoughts..." rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Send Message'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 Bixfind. Find Every Service, Every Provider, Everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
