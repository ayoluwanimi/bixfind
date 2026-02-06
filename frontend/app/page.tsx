'use client'

import Link from 'next/link'
import { useState } from 'react'

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

const featuredProviders = [
  {
    id: 1,
    name: 'Pro Plumbing Services',
    category: 'Plumbing',
    rating: 4.9,
    reviews: 187,
    image: '/api/placeholder/300/200',
  },
  {
    id: 2,
    name: 'Elite Electrical',
    category: 'Electrical',
    rating: 4.8,
    reviews: 156,
    image: '/api/placeholder/300/200',
  },
  {
    id: 3,
    name: 'Sparkle Clean Co.',
    category: 'Cleaning',
    rating: 4.7,
    reviews: 234,
    image: '/api/placeholder/300/200',
  },
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Bixfind" className="h-10 w-10" />
            <span className="text-2xl font-bold gradient-text">BIXFIND</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#categories" className="text-gray-700 hover:text-[#001A4D]">Browse</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-[#001A4D]">How it works</a>
            <a href="#" className="text-gray-700 hover:text-[#001A4D]">Become Provider</a>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-[#001A4D] hover:opacity-80">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#001A4D] to-[#0033A0] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Find Every Service
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Connect with trusted service providers in your area
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="What service are you looking for?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
            />
            <button className="btn-secondary px-8 py-3 whitespace-nowrap">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Popular Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-4xl mb-4">{cat.icon}</div>
                <h3 className="font-semibold text-gray-800">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Search', desc: 'Find services in your area' },
              { step: 2, title: 'Compare', desc: 'View providers and ratings' },
              { step: 3, title: 'Book', desc: 'Schedule your service' },
              { step: 4, title: 'Enjoy', desc: 'Get your service delivered' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[#FF1E75] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Top Rated Providers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gray-300 h-48"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{provider.name}</h3>
                  <p className="text-gray-600 mb-4">{provider.category}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold ml-1">{provider.rating}</span>
                      <span className="text-gray-600 text-sm"> ({provider.reviews} reviews)</span>
                    </div>
                  </div>
                  <button className="btn-primary w-full mt-4">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">What Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', text: 'Found a great plumber within minutes. Service was excellent!', rating: 5 },
              { name: 'John D.', text: 'Easy to book and the provider was very professional.', rating: 5 },
              { name: 'Emma L.', text: 'Bixfind made finding a cleaning service so convenient.', rating: 5 },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="text-yellow-500 mb-2">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#FF1E75] to-[#00D84F] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of customers finding services today</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/signup" className="bg-white text-[#FF1E75] px-8 py-3 rounded-lg font-bold hover:opacity-90">
              Sign Up Now
            </Link>
            <Link href="/provider/signup" className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-[#FF1E75]">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001A4D] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Bixfind</h4>
              <p className="text-gray-300 text-sm">Find every service, everywhere</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-300 text-sm">
            <p>&copy; 2024 Bixfind. All rights reserved. Find Every Service, Every Provider, Everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
