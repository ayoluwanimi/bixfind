const API_KEY = process.env.NOMINATIM_API_KEY || ''
const GEOCODE_API = process.env.GEOCODE_API_KEY || ''

// Free geocoding using Nominatim (OpenStreetMap) - no API key required
app.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' })
    }
    
    // Try Nominatim first (free, no key)
    try {
      const nominatimRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'Bixfind/1.0'
        }
      })
      
      if (nominatimRes.data && nominatimRes.data.length > 0) {
        const result = nominatimRes.data[0]
        return res.json({
          success: true,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
          details: result.address
        })
      }
    } catch (e) {
      console.log('Nominatim failed, trying alternative')
    }
    
    // Fallback to Geocode.maps.co
    if (GEOCODE_API) {
      try {
        const geoRes = await axios.get(`https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${GEOCODE_API}`)
        if (geoRes.data && geoRes.data.length > 0) {
          const result = geoRes.data[0]
          return res.json({
            success: true,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          })
        }
      } catch (e) {}
    }
    
    res.status(404).json({ error: 'Address not found' })
  } catch (error) {
    console.error('Geocode error:', error)
    res.status(500).json({ error: 'Failed to geocode address' })
  }
})

// Reverse geocoding - get address from coordinates
app.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' })
    }
    
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: parseFloat(lat),
        lon: parseFloat(lng),
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Bixfind/1.0'
      }
    })
    
    if (response.data) {
      res.json({
        success: true,
        address: response.data.display_name,
        details: response.data.address
      })
    } else {
      res.status(404).json({ error: 'Location not found' })
    }
  } catch (error) {
    console.error('Reverse geocode error:', error)
    res.status(500).json({ error: 'Failed to reverse geocode' })
  }
})

// Validate phone number
app.post('/validate-phone', async (req, res) => {
  try {
    const { phone } = req.body
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' })
    }
    
    // Clean phone number
    const cleaned = phone.replace(/[^+\d]/g, '')
    
    // Basic validation - check format
    const valid = /^[+]?[\d]{10,15}$/.test(cleaned)
    
    // Try NumVerify API if available
    if (process.env.NUMVERIFY_API_KEY) {
      try {
        const response = await axios.get(`http://apilayer.net/api/validate?access_key=${process.env.NUMVERIFY_API_KEY}&number=${cleaned}`)
        if (response.data.valid) {
          return res.json({
            valid: true,
            country: response.data.country_name,
            carrier: response.data.carrier,
            lineType: response.data.line_type
          })
        }
      } catch (e) {}
    }
    
    res.json({ valid })
  } catch (error) {
    console.error('Phone validation error:', error)
    res.status(500).json({ error: 'Failed to validate phone' })
  }
})

// Validate email
app.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const valid = emailRegex.test(email)
    
    // Try Abstract API if available
    if (process.env.ABSTRACT_API_KEY) {
      try {
        const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`)
        if (response.data.is_valid_format && response.data.deliverability !== 'UNDELIVERABLE') {
          return res.json({
            valid: true,
            deliverable: response.data.deliverability,
            quality: response.data.quality_score
          })
        }
      } catch (e) {}
    }
    
    res.json({ valid })
  } catch (error) {
    console.error('Email validation error:', error)
    res.status(500).json({ error: 'Failed to validate email' })
  }
})