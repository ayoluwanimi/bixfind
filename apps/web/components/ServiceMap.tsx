'use client'

import { useEffect, useState, useRef } from 'react'
import { MapPin, Navigation, Locate, Map } from 'lucide-react'

interface Provider {
  id: string
  name: string
  service: string
  lat?: number
  lng?: number
  address?: string
  rating?: number
  price?: string
  phone?: string
  logo_url?: string
  slug?: string
  is_verified?: boolean
  description?: string
}

interface MapProps {
  providers?: Provider[]
  center?: [number, number]
  zoom?: number
  height?: string
  autoLocate?: boolean
}

export default function ServiceMap({ 
  providers = [], 
  center = [6.5244, 3.3792],
  zoom = 12,
  height = '400px',
  autoLocate = false
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [providersWithCoords, setProvidersWithCoords] = useState<Provider[]>([])

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || typeof window === 'undefined' || !window.L) return

    // Remove existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    // Create map
    const map = window.L.map(mapRef.current).setView([center[0], center[1]], zoom)

    // Add OpenStreetMap tiles (free, no API key)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    setIsLoaded(true)
  }, [isLoaded, center, zoom])

  // Auto locate user
  useEffect(() => {
    if (!isLoaded || !autoLocate || !mapInstanceRef.current || !window.L) return
    if (userLocation) return

    if (navigator.geolocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          
          // Add user marker
          if (mapInstanceRef.current && window.L) {
            window.L.marker([latitude, longitude], {
              icon: window.L.divIcon({
                className: 'user-marker',
                html: '<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })
            }).addTo(mapInstanceRef.current)
              .bindPopup('Your Location')
            
            mapInstanceRef.current.setView([latitude, longitude], 14)
          }
          setIsLocating(false)
        },
        (error) => {
          console.log('Geolocation error:', error)
          setIsLocating(false)
        }
      )
    }
  }, [isLoaded, autoLocate, userLocation])

  // Update providers with coordinates
  useEffect(() => {
    if (!isLoaded || !window.L || !mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Filter providers with coordinates
    const providersWithLocation = providers.filter(p => p.lat && p.lng)
    setProvidersWithCoords(providersWithLocation)

    // Add provider markers
    providersWithLocation.forEach(provider => {
      const icon = window.L.divIcon({
        className: 'provider-marker',
        html: `<div style="background:#10B981;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      const marker = window.L.marker([provider.lat!, provider.lng!], { icon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div style="min-width:180px;font-family:system-ui,-apple-system,sans-serif">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              ${provider.logo_url ? `<img src="${provider.logo_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'" />` : ''}
              <div>
                <strong style="font-size:14px">${provider.name}</strong>
                ${provider.is_verified ? '<span style="color:#10B981;font-size:10px">✓ Verified</span>' : ''}
              </div>
            </div>
            <span style="color:#6B7280;font-size:12px">${provider.service}</span><br/>
            ${provider.address ? `<span style="font-size:11px;color:#9CA3AF">${provider.address}</span><br/>` : ''}
            ${provider.rating ? `<span style="font-size:12px">★ ${provider.rating}</span><br/>` : ''}
            <a href="/p/${provider.slug || provider.id}" style="display:inline-block;margin-top:6px;padding:4px 10px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border-radius:6px;font-size:12px;text-decoration:none">Visit Website</a>
          </div>
        `)

      markersRef.current.push(marker)
    })
  }, [isLoaded, providers])

  const handleLocate = () => {
    if (!mapInstanceRef.current || !window.L || !navigator.geolocation) return
    
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])
        mapInstanceRef.current.setView([latitude, longitude], 14)
        
        // Add/update user marker
        window.L.marker([latitude, longitude], {
          icon: window.L.divIcon({
            className: 'user-marker',
            html: '<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(mapInstanceRef.current)
          .bindPopup('Your Location')
        
        setIsLocating(false)
      },
      () => setIsLocating(false)
    )
  }

  if (!isLoaded) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <Map className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 disabled:opacity-50"
          title="Find my location"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Locate className="w-5 h-5 text-blue-600" />
          )}
        </button>
      </div>

      {/* Provider count */}
      {providersWithCoords.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white px-3 py-1.5 rounded-lg shadow-md text-sm">
          <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
          {providersWithCoords.length} provider{providersWithCoords.length > 1 ? 's' : ''} on map
        </div>
      )}
    </div>
  )
}