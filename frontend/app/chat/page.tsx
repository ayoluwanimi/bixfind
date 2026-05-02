'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, User, ChevronLeft, Search, MoreVertical, Phone, Video, Home, Menu, LogOut } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { storage } from '@/lib/storage'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const { chats, activeChat, startChat, sendMessage, setActiveChat, markChatAsRead } = useChat()
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const savedUser = storage.getUser()
    if (savedUser) {
      setUser(savedUser)
    }
  }, [])

  const handleLogout = () => {
    storage.setUser(null)
    router.push('/')
  }

  const goToProfile = () => {
    if (user?.userType === 'provider') {
      router.push('/provider-dashboard')
    } else if (user?.userType === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  const filteredChats = chats.filter(chat => 
    chat.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message)
      setMessage('')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your chats</h2>
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-4 mb-4">
        <div className="flex h-full">
          {/* Chat List Sidebar */}
          <div className={`w-full md:w-80 border-r flex flex-col ${activeChat ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Messages
              </h1>
            </div>
            
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start chatting with providers</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.participantId}
                    onClick={() => {
                      setActiveChat(chat)
                      markChatAsRead(chat.participantId)
                    }}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${activeChat?.participantId === chat.participantId ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {chat.participantAvatar ? (
                          <img src={chat.participantAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{chat.participantName}</h3>
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          {activeChat ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {activeChat.participantAvatar ? (
                    <img src={activeChat.participantAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold">{activeChat.participantName}</h2>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Send a message to start the conversation</p>
                  </div>
                ) : (
                  activeChat.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.senderId === user.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
