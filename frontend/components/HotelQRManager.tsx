'use client'

import { useState, useEffect } from 'react'
import { QrCode, Scan, X, Check, User, Calendar, Building, Phone, Mail, MapPin, Clock, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'
import { realtimeDb } from '@/lib/realtime'

interface Guest {
  id: string
  name: string
  phone: string
  email: string
  roomNumber: string
  checkInDate: string
  checkOutDate: string
  hotelName: string
  hotelId: string
  status: 'checked-in' | 'checked-out'
  createdAt: number
}

interface QRCodeData {
  type: 'bixfind-guest'
  guestId: string
  hotelId: string
  roomNumber: string
  checkIn: string
  checkOut: string
}

export default function HotelQRManager({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'generator' | 'scanner'>('generator')
  const [guests, setGuests] = useState<Guest[]>([])
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [isHotelCategory, setIsHotelCategory] = useState(false)
  
  const [newGuest, setNewGuest] = useState({
    name: '',
    phone: '',
    email: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: ''
  })

  useEffect(() => {
    // Check if user is in hotel category
    if (user?.category?.toLowerCase().includes('hotel') || 
        user?.businessName?.toLowerCase().includes('hotel') ||
        user?.service?.toLowerCase().includes('hotel')) {
      setIsHotelCategory(true)
    }
    
    // Load guests from localStorage
    const savedGuests = storage.get(`hotel_guests_${user?.id}`) || []
    setGuests(savedGuests)
  }, [user])

  const generateQRCodeUrl = (guest: Guest): string => {
    const qrData: QRCodeData = {
      type: 'bixfind-guest',
      guestId: guest.id,
      hotelId: user?.id,
      roomNumber: guest.roomNumber,
      checkIn: guest.checkInDate,
      checkOut: guest.checkOutDate
    }
    
    // Use QR Server API (free, no key required)
    const encoded = encodeURIComponent(JSON.stringify(qrData))
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`
  }

  const addGuest = () => {
    if (!newGuest.name || !newGuest.roomNumber || !newGuest.checkInDate) {
      toast.error('Please fill required fields')
      return
    }
    
    const guest: Guest = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newGuest.name,
      phone: newGuest.phone,
      email: newGuest.email,
      roomNumber: newGuest.roomNumber,
      checkInDate: newGuest.checkInDate,
      checkOutDate: newGuest.checkOutDate || newGuest.checkInDate,
      hotelName: user?.businessName || 'Hotel',
      hotelId: user?.id,
      status: 'checked-in',
      createdAt: Date.now()
    }
    
    const updatedGuests = [...guests, guest]
    setGuests(updatedGuests)
    storage.set(`hotel_guests_${user?.id}`, updatedGuests)
    
    // Save to Firebase
    realtimeDb.set(`hotelGuests/${user?.id}/${guest.id}`, guest)
    
    setNewGuest({ name: '', phone: '', email: '', roomNumber: '', checkInDate: '', checkOutDate: '' })
    setShowAddGuest(false)
    toast.success('Guest added successfully!')
  }

  const checkOutGuest = (guestId: string) => {
    const updated = guests.map(g => 
      g.id === guestId ? { ...g, status: 'checked-out' as const } : g
    )
    setGuests(updated)
    storage.set(`hotel_guests_${user?.id}`, updated)
    realtimeDb.set(`hotelGuests/${user?.id}/${guestId}/status`, 'checked-out')
    toast.success('Guest checked out!')
  }

  const deleteGuest = (guestId: string) => {
    const updated = guests.filter(g => g.id !== guestId)
    setGuests(updated)
    storage.set(`hotel_guests_${user?.id}`, updated)
    toast.success('Guest removed')
  }

  const downloadQR = (guest: Guest) => {
    const qrUrl = generateQRCodeUrl(guest)
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `guest-qr-${guest.roomNumber}.png`
    link.click()
  }

  if (!isHotelCategory) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hotel Guest Management</h2>
            <p className="text-sm text-gray-500">QR Code check-in system</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'generator' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            Generate QR
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'scanner' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            <Scan className="w-4 h-4 inline mr-2" />
            Scan QR
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div>
          {/* Add Guest Button */}
          <button
            onClick={() => setShowAddGuest(true)}
            className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 mb-6 flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Add New Guest
          </button>

          {/* Guest List */}
          {guests.length > 0 ? (
            <div className="space-y-3">
              {guests.map(guest => (
                <div key={guest.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${guest.status === 'checked-in' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-gray-500">Room {guest.roomNumber} • {guest.checkInDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedGuest(guest); setShowQR(true) }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {guest.status === 'checked-in' && (
                      <button
                        onClick={() => checkOutGuest(guest.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteGuest(guest.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No guests yet</p>
              <p className="text-sm">Add guests to generate QR codes</p>
            </div>
          )}
        </div>
      ) : (
        <QRScanner hotelId={user?.id} />
      )}

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Guest</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Guest Name *"
                value={newGuest.name}
                onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newGuest.phone}
                onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={newGuest.email}
                onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Room Number *"
                value={newGuest.roomNumber}
                onChange={e => setNewGuest({ ...newGuest, roomNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  placeholder="Check-in Date *"
                  value={newGuest.checkInDate}
                  onChange={e => setNewGuest({ ...newGuest, checkInDate: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  placeholder="Check-out Date"
                  value={newGuest.checkOutDate}
                  onChange={e => setNewGuest({ ...newGuest, checkOutDate: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddGuest(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addGuest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Display Modal */}
      {showQR && selectedGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-2">{selectedGuest.name}</h3>
            <p className="text-gray-500 mb-4">Room {selectedGuest.roomNumber}</p>
            
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img 
                src={generateQRCodeUrl(selectedGuest)} 
                alt="Guest QR Code" 
                className="w-48 h-48"
              />
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Show this QR code to the receptionist
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => downloadQR(selectedGuest)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => {
                  const qrUrl = generateQRCodeUrl(selectedGuest)
                  navigator.clipboard.writeText(qrUrl)
                  toast.success('QR URL copied!')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// QR Scanner Component for Receptionist
function QRScanner({ hotelId }: { hotelId?: string }) {
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // For simplicity, we'll use manual code entry with camera scanning option
  const handleManualSubmit = () => {
    try {
      const data = JSON.parse(manualCode)
      if (data.type === 'bixfind-guest') {
        setScannedData(data)
        setShowResult(true)
        
        // Log the scan
        realtimeDb.push('visitorScans', {
          hotelId: data.hotelId,
          guestId: data.guestId,
          roomNumber: data.roomNumber,
          scannedAt: Date.now()
        })
      } else {
        toast.error('Invalid QR code')
      }
    } catch (e) {
      toast.error('Invalid QR code format')
    }
  }

  const confirmCheckIn = () => {
    if (scannedData) {
      toast.success(`Guest checked in to Room ${scannedData.roomNumber}`)
      setShowResult(false)
      setManualCode('')
      setScannedData(null)
    }
  }

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Scan className="w-10 h-10 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-bold mb-2">Scan Guest QR Code</h3>
      <p className="text-gray-500 mb-6">Enter the QR code data or use camera</p>
      
      <div className="space-y-4 max-w-sm mx-auto">
        <textarea
          placeholder="Paste QR code data here..."
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg h-24 text-sm"
        />
        
        <button
          onClick={handleManualSubmit}
          disabled={!manualCode}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          Verify Guest
        </button>
        
        <p className="text-sm text-gray-400">
          Or use your phone camera to scan the guest's QR code
        </p>
        
        {/* Camera scan hint */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Point camera at guest's QR code to scan automatically
          </p>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && scannedData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-lg font-bold text-center mb-4">Guest Verified!</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Room:</span>
                <span className="font-medium">{scannedData.roomNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Check-in:</span>
                <span className="font-medium">{scannedData.checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-out:</span>
                <span className="font-medium">{scannedData.checkOut}</span>
              </div>
            </div>
            
            <button
              onClick={confirmCheckIn}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium"
            >
              Confirm Check-in
            </button>
            
            <button
              onClick={() => { setShowResult(false); setScannedData(null) }}
              className="w-full py-2 mt-2 text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Camera({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
