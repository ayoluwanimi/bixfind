'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, MessageCircle, Menu, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, ContactFormData } from '../../lib/validations'
import { emailTemplates, sendEmail } from '../../lib/email'
import { FormInput } from '../../components/FormInput'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Send confirmation email to user
      await sendEmail(emailTemplates.contactReplyEmail(data.name, data.email))
      
      // In production, send to admin/support email
      console.log('Contact message:', data)
      
      setSubmitted(true)
      reset()
      
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      console.error('Failed to send message')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold text-blue-600">BIXFIND</span>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/contact" className="text-blue-600 font-semibold">Contact</Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/signup" className="hidden md:block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition">
              Sign Up
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="text-gray-700" /> : <Menu className="text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/about" className="block text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="block text-blue-600 font-semibold">Contact</Link>
              <Link href="/auth/login" className="block text-gray-700 hover:text-blue-600">Sign In</Link>
              <Link href="/auth/signup" className="block text-blue-600 font-semibold">Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            
            <div className="flex gap-4">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600">support@bixfind.com</p>
                <p className="text-gray-600">info@bixfind.com</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
                <p className="text-gray-600">Mon-Fri, 9AM-6PM EST</p>
              </div>
            </div>

            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-600">123 Tech Street</p>
                <p className="text-gray-600">San Francisco, CA 94105</p>
              </div>
            </div>

            <div className="flex gap-4">
              <MessageCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Connect With Us</h3>
                <p className="text-gray-600">WhatsApp, Telegram, and Email Support</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

            {submitted && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                ✓ Thank you! We've received your message and will get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                label="Name"
                placeholder="John Doe"
                required
                {...register('name')}
                error={errors.name}
              />

              <FormInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                {...register('email')}
                error={errors.email}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  {...register('subject')}
                  placeholder="How can we help?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  {...register('message')}
                  placeholder="Tell us your thoughts..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'How do I book a service?', a: 'Sign up, browse services, and book directly from the provider profile.' },
              { q: 'Is my payment secure?', a: 'Yes, we use encrypted payment processing and SSL security.' },
              { q: 'How do I become a service provider?', a: 'Sign up as a provider, complete verification, and start listing your services.' },
              { q: 'What if I\'m not satisfied?', a: 'We offer a satisfaction guarantee and dispute resolution process.' },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 Bixfind. Find Every Service, Every Provider, Everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
