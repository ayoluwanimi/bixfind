'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Users, Zap, Globe, Menu, X } from 'lucide-react'

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
            <Link href="/about" className="text-blue-600 font-semibold">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
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
              <Link href="/about" className="block text-blue-600 font-semibold">About</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-blue-600">Contact</Link>
              <Link href="/auth/login" className="block text-gray-700 hover:text-blue-600">Sign In</Link>
              <Link href="/auth/signup" className="block text-blue-600 font-semibold">Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About Bixfind</h1>
          <p className="text-xl text-blue-100">
            Find Every Service, Every Provider, Everywhere
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-4 text-lg">
              Bixfind is dedicated to connecting customers with reliable service providers across every industry. We believe that finding quality services should be simple, transparent, and accessible to everyone.
            </p>
            <p className="text-gray-600 mb-4 text-lg">
              Whether you're looking for home maintenance, professional services, or specialized expertise, Bixfind brings you face-to-face with trusted providers in your area.
            </p>
            <p className="text-gray-600 text-lg">
              Our platform empowers service providers to grow their business while giving customers the confidence to find and hire the best talent.
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg h-80"></div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
                title: 'Trust & Safety',
                description: 'We verify every provider to ensure quality and reliability'
              },
              {
                icon: <Users className="w-12 h-12 text-green-600" />,
                title: 'Community',
                description: 'Building strong connections between customers and providers'
              },
              {
                icon: <Zap className="w-12 h-12 text-orange-600" />,
                title: 'Innovation',
                description: 'Continuously improving our platform for better experiences'
              },
              {
                icon: <Globe className="w-12 h-12 text-purple-600" />,
                title: 'Accessibility',
                description: 'Making quality services available to everyone, everywhere'
              },
            ].map((value, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 text-center">
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">By The Numbers</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '2K+', label: 'Service Providers' },
            { number: '$5M+', label: 'Services Completed' },
            { number: '50+', label: 'Service Categories' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</p>
              <p className="text-gray-600 text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Service?</h2>
          <Link href="/auth/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
            Get Started Today
          </Link>
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
