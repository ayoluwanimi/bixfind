'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, ChevronLeft, User } from 'lucide-react'
import { useChat } from '@/context/ChatContext'

interface ChatWidgetProps {
  providerId: string
  providerName: string
  providerAvatar?: string
}

export default function ChatWidget({ providerId, providerName, providerAvatar }: ChatWidgetProps) {
  const { startChat, sendMessage, setActiveChat } = useChat()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chatStarted, setChatStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleStartChat = () => {
    startChat(providerId, providerName, providerAvatar)
    setChatStarted(true)
    setIsOpen(true)
  }

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message)
      setMessage('')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatStarted])

  if (!isOpen) {
    return (
      <button
        onClick={handleStartChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
        <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {providerAvatar ? (
            <img src={providerAvatar} alt={providerName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{providerName}</h3>
          <p className="text-xs text-white/80">Click to chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Send a message to start chatting</p>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
