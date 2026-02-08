'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    { title: 'Total Users', value: '1,247', change: '+12%', color: 'bg-blue-500' },
    { title: 'Total Providers', value: '342', change: '+8%', color: 'bg-green-500' },
    { title: 'Total Revenue', value: '$45,230', change: '+23%', color: 'bg-purple-500' },
    { title: 'Active Requests', value: '89', change: '-5%', color: 'bg-pink-500' },
  ]

  const recentTransactions = [
    { id: 'TXN001', user: 'John Doe', provider: 'Pro Plumbing', amount: '$150', status: 'Completed', date: '2024-02-05' },
    { id: 'TXN002', user: 'Sarah M.', provider: 'Elite Electrical', amount: '$200', status: 'Processing', date: '2024-02-05' },
    { id: 'TXN003', user: 'Emma L.', provider: 'Sparkle Clean', amount: '$85', status: 'Completed', date: '2024-02-04' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <div>
              <div className="text-2xl font-bold text-blue-600">BIXFIND</div>
              <span className="text-xs text-gray-600">Admin</span>
            </div>
          </Link>
          <button className="btn-primary">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${stat.color} text-white p-6 rounded-lg shadow`}>
              <p className="text-gray-200 text-sm">{stat.title}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
              <p className="text-sm mt-2 opacity-90">{stat.change} from last month</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b">
            {['overview', 'users', 'providers', 'transactions', 'support'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-[#FF1E75] text-[#FF1E75]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4">Platform Health</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>API Uptime</span>
                        <span className="font-bold text-green-600">99.9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Status</span>
                        <span className="font-bold text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Sessions</span>
                        <span className="font-bold">2,341</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">This Month</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>New Users</span>
                        <span className="font-bold">+156</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Providers</span>
                        <span className="font-bold">+28</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission Earned</span>
                        <span className="font-bold text-green-600">$4,523</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">User Management</h2>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">User ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Joined</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'U001', name: 'John Doe', email: 'john@example.com', joined: '2024-01-15', status: 'Active' },
                      { id: 'U002', name: 'Sarah M.', email: 'sarah@example.com', joined: '2024-01-20', status: 'Active' },
                      { id: 'U003', name: 'Emma L.', email: 'emma@example.com', joined: '2024-01-25', status: 'Suspended' },
                    ].map((user, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{user.name}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.joined}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'providers' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Provider Management</h2>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Provider ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Business</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Category</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Rating</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'P001', business: 'Pro Plumbing', category: 'Plumbing', rating: '4.9', verification: 'Verified' },
                      { id: 'P002', business: 'Elite Electrical', category: 'Electrical', rating: '4.8', verification: 'Verified' },
                      { id: 'P003', business: 'New Services', category: 'Cleaning', rating: 'N/A', verification: 'Pending' },
                    ].map((provider, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{provider.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{provider.business}</td>
                        <td className="px-4 py-3 text-sm">{provider.category}</td>
                        <td className="px-4 py-3 text-sm">{provider.rating}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            provider.verification === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {provider.verification}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Transaction ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Provider</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{txn.id}</td>
                        <td className="px-4 py-3 text-sm">{txn.user}</td>
                        <td className="px-4 py-3 text-sm">{txn.provider}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{txn.amount}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            txn.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{txn.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'support' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Support Tickets</h2>
                <div className="space-y-4">
                  {[
                    { id: 'TKT001', user: 'John Doe', subject: 'Payment issue', status: 'Open', priority: 'High' },
                    { id: 'TKT002', user: 'Sarah M.', subject: 'Service complaint', status: 'In Progress', priority: 'Medium' },
                    { id: 'TKT003', user: 'Emma L.', subject: 'Request cancellation', status: 'Resolved', priority: 'Low' },
                  ].map((ticket, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{ticket.subject}</p>
                          <p className="text-sm text-gray-600">From: {ticket.user}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                            ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
