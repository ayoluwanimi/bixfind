'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Shield, Heart, Award } from 'lucide-react'
import AuthAwareNav from '../../../components/AuthAwareNav'

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <AuthAwareNav currentPath="/about" />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-900 text-white py-20 px-4 relative overflow-hidden">
        <motion.div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl opacity-10" animate={{ x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-10" animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            About <span className="text-yellow-300">Bixfind</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Find Every Service, Every Provider, Everywhere
          </motion.p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl h-80 shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          />
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-bold text-gray-900 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Our Core Values
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <CheckCircle className="w-12 h-12 text-blue-600" />, title: 'Trust & Safety', description: 'We verify every provider to ensure quality and reliability' },
              { icon: <Shield className="w-12 h-12 text-green-600" />, title: 'Security', description: 'Your data and transactions are always protected' },
              { icon: <Heart className="w-12 h-12 text-pink-600" />, title: 'Customer First', description: 'We prioritize your satisfaction above all else' },
              { icon: <Award className="w-12 h-12 text-purple-600" />, title: 'Excellence', description: 'Setting the standard for service marketplaces' },
            ].map((value, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                className="bg-white rounded-2xl shadow-lg p-6 text-center"
              >
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  {value.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">By The Numbers</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { icon: '👥', label: 'Active Users' },
            { icon: '🏪', label: 'Service Providers' },
            { icon: '✅', label: 'Services Completed' },
            { icon: '📂', label: 'Service Categories' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl mb-2">{stat.icon}</p>
              <p className="text-gray-600 text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Service?</h2>
          <Link href="/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
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
