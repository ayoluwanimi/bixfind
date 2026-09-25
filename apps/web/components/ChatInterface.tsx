'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, ChevronLeft, Search, MoreVertical, Phone, RefreshCw, Loader2 as Spinner } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { toast } from 'sonner'

export default function ChatInterface() {
  const { chats, activeChat, startChat, sendMessage, setActiveChat, markChatAsRead, refreshChats, isLoading } = useChat()
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = (window as any).__bixfind_user
    if (savedUser) {
      setUser(savedUser)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshChats()
    setRefreshing(false)
    toast.success('Chats refreshed')
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

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-4 mb-4">
      <div className="flex h-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className={`w-full md:w-80 border-r flex flex-col ${activeChat ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Messages
            </h1>
            {chats.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{chats.length}</span>
            )}
          </div>
          
          <div className="p-3 border-b">
            <div className="relative flex items-center gap-2">
              <Search className="absolute left-3 w-4 h-4 text-gray-400" style={{ top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
              />
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with providers</p>
              </div>
            ) : (
              filteredChats.map((chat, i) => (
                <motion.div
                  key={chat.participantId}
                  onClick={() => {
                    setActiveChat(chat)
                    markChatAsRead(chat.participantId)
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${activeChat?.participantId === chat.participantId ? 'bg-blue-50' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {chat.participantAvatar ? (
                        <img src={chat.participantAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.participantName}</h3>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                      {chat.lastMessageTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(chat.lastMessageTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {activeChat ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {activeChat.participantAvatar ? (
                  <img src={activeChat.participantAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{activeChat.participantName}</h2>
                <p className="text-xs text-gray-500">{activeChat.messages.length} messages</p>
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
                  <motion.div 
                    key={msg.id} 
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.senderId === user?.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
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
                <motion.button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            className="hidden md:flex flex-1 items-center justify-center text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </motion.div>
              <p>Select a conversation to start chatting</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function MessageCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  )
}

function User(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}