'use client'

import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Bixfind" className="h-10 w-10" />
            <span className="text-2xl font-bold gradient-text">BIXFIND</span>
          </Link>
          <button className="btn-primary">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { title: 'Active Requests', value: '3', color: 'bg-blue-500' },
            { title: 'Completed', value: '12', color: 'bg-green-500' },
            { title: 'Total Spent', value: '$450', color: 'bg-purple-500' },
            { title: 'Saved Providers', value: '8', color: 'bg-pink-500' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} text-white p-6 rounded-lg shadow`}>
              <p className="text-gray-200 text-sm">{stat.title}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-20">
              <nav className="space-y-2">
                <a href="#" className="block px-4 py-2 bg-[#001A4D] text-white rounded-lg">Dashboard</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">My Requests</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Messages</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Favorites</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Payments</a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Settings</a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
              <p className="text-gray-600 mb-6">Here's what's happening with your account today.</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-[#FF1E75] bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-800">Active Request - Plumbing Service</h3>
                  <p className="text-gray-600 text-sm mt-1">Pro Plumbing Services - Waiting for provider response</p>
                  <div className="mt-2 text-sm text-gray-600">Requested 2 hours ago</div>
                </div>

                <div className="border-l-4 border-green-500 bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-800">Completed - House Cleaning</h3>
                  <p className="text-gray-600 text-sm mt-1">Sparkle Clean Co. - Leave a review</p>
                  <div className="mt-2">
                    <button className="text-[#FF1E75] font-semibold text-sm hover:underline">
                      Leave Review
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Electrical Repair', category: 'Electrical' },
                  { name: 'Hair Salon', category: 'Beauty' },
                ].map((service, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer">
                    <div className="h-24 bg-gray-200 rounded mb-2"></div>
                    <p className="font-semibold text-sm">{service.name}</p>
                    <p className="text-gray-600 text-xs">{service.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
