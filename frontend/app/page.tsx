'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Star, Users, Zap, CheckCircle, Search, MapPin } from 'lucide-react'

const categories = [
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Painting', icon: '🎨' },
  { name: 'Car Repairs', icon: '🚗' },
  { name: 'Hair Salon', icon: '✂️' },
  { name: 'Tutoring', icon: '📚' },
  { name: 'Fitness', icon: '💪' },
]

const testimonials = [
  { name: 'John Doe', rating: 5, text: 'Great service! Found the perfect plumber within minutes.' },
  { name: 'Sarah Smith', rating: 5, text: 'Very professional providers and easy to use platform.' },
  { name: 'Mike Johnson', rating: 5, text: 'As a provider, I\'ve grown my business significantly.' },
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-blue-600">BIXFIND</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#categories" className="text-gray-600 hover:text-gray-900">Services</a>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/support" className="text-gray-600 hover:text-gray-900">Support</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-900 font-semibold">
              Sign In
            </Link>
            <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Find Every Service
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Every Provider, Everywhere
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full outline-none text-gray-900"
                />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Where?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full outline-none text-gray-900"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-semibold transition">
                Search
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mt-8 flex-col md:flex-row">
            <Link href="/auth/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Get Started as Customer
            </Link>
            <Link href="/auth/signup" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Choose Bixfind?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Zap className="w-12 h-12 text-blue-600" />, title: 'Quick & Easy', desc: 'Find services in seconds' },
              { icon: <Users className="w-12 h-12 text-green-600" />, title: 'Trusted Providers', desc: 'Verified professionals' },
              { icon: <CheckCircle className="w-12 h-12 text-orange-600" />, title: 'Guaranteed Quality', desc: 'Quality assurance' },
              { icon: <Star className="w-12 h-12 text-yellow-600" />, title: 'Best Prices', desc: 'Competitive rates' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Browse Services</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <p className="text-4xl mb-2">{cat.icon}</p>
              <h3 className="font-bold text-gray-900">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">What People Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{test.text}"</p>
                <p className="font-bold text-gray-900">- {test.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Search', desc: 'Find the service you need' },
            { step: '2', title: 'Compare', desc: 'Review providers & pricing' },
            { step: '3', title: 'Book', desc: 'Book instantly & pay securely' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-16 px-4 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of customers and providers on Bixfind</p>
          <div className="flex gap-4 justify-center flex-col md:flex-row">
            <Link href="/auth/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Sign Up as Customer
            </Link>
            <Link href="/auth/signup" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Bixfind</h3>
              <p className="text-gray-400">Find Every Service, Every Provider, Everywhere</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <Link href="/about" className="hover:text-white">About Us</Link>
                <br />
                <Link href="/contact" className="hover:text-white">Contact</Link>
                <br />
                <Link href="/support" className="hover:text-white">Support</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Providers</h4>
              <div className="space-y-2 text-gray-400">
                <Link href="/auth/signup" className="hover:text-white">Become a Provider</Link>
                <br />
                <a href="#" className="hover:text-white">How It Works</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="space-y-2 text-gray-400">
                <a href="https://wa.me/1234567890" className="hover:text-white" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <br />
                <a href="https://t.me/bixfind_support" className="hover:text-white" target="_blank" rel="noopener noreferrer">Telegram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bixfind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
