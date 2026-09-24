import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataFile = path.join(__dirname, 'data.json')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
const app = express()

// Load environment variables from .env
try {
  const envPath = path.join(__dirname, '..', '.env')
  if (fsSync.existsSync(envPath)) {
    const envContent = fsSync.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=')
        const key = k.trim()
        const val = v.join('=').trim()
        if (key && val && !process.env[key]) {
          process.env[key] = val
        }
      }
    })
  }
} catch (e) {
  console.log('Env load note:', e.message)
}

const port = process.env.PORT || 8787

app.use(cors())
app.use(express.json())

const fallbackData = {
  incidents: [
    { id: 'OS-2026-0147', location: 'Arabian Sea (Mumbai Offshore)', area: '14.6 km²', confidence: 92, severity: 'High', time: '18 min ago', status: 'Under review', x: 34, y: 42, lat: 18.9500, lng: 72.4500, coordinates: '18.9500° N, 72.4500° E', nearestVessel: 'MV Ocean Star', vesselDistance: '8.2 km' },
    { id: 'OS-2026-0148', location: 'Gulf of Kutch (Gujarat)', area: '4.2 km²', confidence: 78, severity: 'Medium', time: '1h 42m ago', status: 'New alert', x: 16, y: 27, lat: 22.5800, lng: 69.4500, coordinates: '22.5800° N, 69.4500° E', nearestVessel: 'MT Meridian', vesselDistance: '12.7 km' },
    { id: 'OS-2026-0149', location: 'Bay of Bengal (Chennai Offshore)', area: '28.1 km²', confidence: 96, severity: 'Critical', time: '3h 08m ago', status: 'Escalated', x: 76, y: 58, lat: 13.1500, lng: 80.4500, coordinates: '13.1500° N, 80.4500° E', nearestVessel: 'Seabird Explorer', vesselDistance: '18.4 km' },
    { id: 'OS-2026-0146', location: 'Mumbai Offshore (South)', area: '2.8 km²', confidence: 71, severity: 'Low', time: 'Yesterday', status: 'Resolved', x: 29, y: 66, lat: 18.7200, lng: 72.6200, coordinates: '18.7200° N, 72.6200° E', nearestVessel: 'Pacific Trader', vesselDistance: '24.1 km' },
  ],
  reports: [],
  alerts: [
    {
      id: 'ALT-2026-8801',
      incidentId: 'OS-2026-0149',
      agency: 'Indian Coast Guard (ICG) - MRCC Chennai',
      agencyCode: 'ICG',
      priority: 'Immediate',
      channel: 'API Webhook & Radio Broadcast',
      location: 'Bay of Bengal',
      coordinates: '13.0827° N, 80.2707° E',
      area: '28.1 km²',
      confidence: 96,
      severity: 'Critical',
      suspectedSource: 'MT Meridian (Cargo)',
      status: 'Units Deployed',
      dispatchedAt: '2h 45m ago',
      acknowledgedAt: '2h 40m ago',
      responseTeam: 'ICGS Samudra Paheredar (Pollution Control Vessel)',
      notes: 'Containment boom deployment initiated. Trajectory model active.',
      autoTriggered: true
    },
    {
      id: 'ALT-2026-8802',
      incidentId: 'OS-2026-0147',
      agency: 'DG Shipping - Marine Environment Cell',
      agencyCode: 'DG_SHIPPING',
      priority: 'Urgent',
      channel: 'Emergency SMS & Email SITREP',
      location: 'Arabian Sea',
      coordinates: '19.0760° N, 72.8777° E',
      area: '14.6 km²',
      confidence: 92,
      severity: 'High',
      suspectedSource: 'MV Ocean Star (Tanker)',
      status: 'Acknowledged',
      dispatchedAt: '15 min ago',
      acknowledgedAt: '12 min ago',
      responseTeam: 'Western Naval Command Alert Group',
      notes: 'Port state control inspection order issued for MV Ocean Star.',
      autoTriggered: true
    },
    {
      id: 'ALT-2026-8803',
      incidentId: 'OS-2026-0148',
      agency: 'INCOIS - Spill Trajectory Division',
      agencyCode: 'INCOIS',
      priority: 'High',
      channel: 'API Webhook',
      location: 'Gulf of Kutch',
      coordinates: '22.6000° N, 69.5000° E',
      area: '4.2 km²',
      confidence: 78,
      severity: 'Medium',
      suspectedSource: 'Unknown Vessel',
      status: 'Dispatched',
      dispatchedAt: '1h 30m ago',
      acknowledgedAt: null,
      responseTeam: 'Pending Acknowledgment',
      notes: 'Hydrodynamic drift simulation requested.',
      autoTriggered: false
    }
  ],
  messages: [
    {
      id: 'MSG-8801',
      alertId: 'ALT-2026-8801',
      incidentId: 'OS-2026-0149',
      agency: 'Indian Coast Guard (ICG) - MRCC Chennai',
      agencyCode: 'ICG',
      sender: 'Commander K. R. Nair (MRCC Ops)',
      message: 'ALERT RECEIVED & VERIFIED: Pollution response vessel ICGS Samudra Paheredar diverted to coordinates 13.0827° N, 80.2707° E with ocean booms.',
      timestamp: '2h 40m ago',
      type: 'dispatch_response'
    },
    {
      id: 'MSG-8802',
      alertId: 'ALT-2026-8802',
      incidentId: 'OS-2026-0147',
      agency: 'DG Shipping - Marine Environment Cell',
      agencyCode: 'DG_SHIPPING',
      sender: 'Capt. S. Sengupta (Flag State Officer)',
      message: 'NOTICE ACKNOWLEDGED: Notice sent to MV Ocean Star master to hold position for environmental compliance check.',
      timestamp: '12 min ago',
      type: 'acknowledgment'
    }
  ]
}

async function readData() {
  try {
    const raw = JSON.parse(await fs.readFile(dataFile, 'utf8'))
    if (!raw.alerts) raw.alerts = fallbackData.alerts
    if (!raw.messages) raw.messages = fallbackData.messages
    return raw
  } catch {
    await writeData(fallbackData)
    return structuredClone(fallbackData)
  }
}
async function writeData(data) { await fs.writeFile(dataFile, JSON.stringify(data, null, 2)) }

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  service: 'ocean-sentinel-api',
  visionModel: process.env.XAI_API_KEY ? 'xAI Grok Vision (grok-2-vision-1212)' : process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o Vision' : 'Simulated AI Vision Agent',
  satelliteService: 'NASA GIBS & Sentinel-1 SAR',
  aisStream: process.env.AISSTREAM_API_KEY ? 'AISStream.io Live' : 'Simulated Live AIS Feed'
}))

app.get('/api/config', (_req, res) => {
  res.json({
    hasXAI: !!process.env.XAI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAISStream: !!process.env.AISSTREAM_API_KEY,
    visionModel: process.env.XAI_VISION_MODEL || process.env.OPENAI_VISION_MODEL || 'grok-2-vision-1212',
    nasaGibsUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    copernicusStatus: 'Enabled'
  })
})

app.get('/api/dashboard', async (_req, res) => {
  const data = await readData()
  res.json({
    totalIncidents: data.incidents.length,
    highRiskAlerts: data.incidents.filter(i => i.severity === 'High' || i.severity === 'Critical').length,
    areaObserved: 24800,
    vesselsNearAlerts: 32,
    incidents: data.incidents,
    alerts: data.alerts || [],
    messages: data.messages || []
  })
})
app.get('/api/incidents', async (_req, res) => { const data = await readData(); res.json(data.incidents) })
app.get('/api/incidents/:id', async (req, res) => { const data = await readData(); const incident = data.incidents.find(item => item.id === req.params.id); incident ? res.json(incident) : res.status(404).json({ message: 'Incident not found' }) })
app.patch('/api/incidents/:id', async (req, res) => { const data = await readData(); const incident = data.incidents.find(item => item.id === req.params.id); if (!incident) return res.status(404).json({ message: 'Incident not found' }); Object.assign(incident, req.body, { updatedAt: new Date().toISOString() }); await writeData(data); res.json(incident) })

// REAL AI VISION AGENT ENDPOINT (xAI Grok / OpenAI Vision / Simulated Fallback)
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A satellite image is required' })

  const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY
  const baseUrl = process.env.XAI_API_KEY 
    ? (process.env.XAI_BASE_URL || 'https://api.x.ai/v1')
    : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')
  const modelName = process.env.XAI_API_KEY
    ? (process.env.XAI_VISION_MODEL || 'grok-2-vision-1212')
    : (process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini')

  if (apiKey) {
    try {
      const mimeType = req.file.mimetype || 'image/jpeg'
      const base64Image = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`

      const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: `You are Ocean Sentinel AI, an expert marine satellite & radar SAR intelligence vision agent. Analyze the provided satellite ocean image for oil spills, hydrocarbon slicks, or surface anomalies. Output ONLY a valid JSON object with these exact keys:
              {
                "oilSpillDetected": boolean,
                "confidence": number (e.g. 94),
                "area": string (e.g. "16.8 km²"),
                "severity": "Critical" | "High" | "Medium" | "Low",
                "nearestVessel": string,
                "vesselDistance": string,
                "location": string,
                "coordinates": string,
                "analysisNotes": string
              }`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this satellite scene for oil spills, determine slick perimeter, and evaluate risk score.' },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ]
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        const text = aiData.choices?.[0]?.message?.content || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return res.json({
            incidentId: `OS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            title: parsed.oilSpillDetected ? 'Hydrocarbon Oil Slick Identified' : 'Clean Surface Verified',
            confidence: parsed.confidence || 92,
            area: parsed.area || '14.6 km²',
            severity: parsed.severity || 'High',
            nearestVessel: parsed.nearestVessel || 'MV Ocean Star',
            vesselDistance: parsed.vesselDistance || '8.2 km',
            sensor: req.body.sensorType || 'SAR',
            location: parsed.location || req.body.location || 'Arabian Sea',
            coordinates: parsed.coordinates || '19.0760° N, 72.8777° E',
            notes: parsed.analysisNotes,
            realAiVision: true,
            model: modelName
          })
        }
      }
    } catch (err) {
      console.log('AI Vision API call fallback triggered:', err.message)
    }
  }

  // Fallback high-fidelity simulation if API key is not configured
  setTimeout(() => res.json({
    incidentId: 'OS-2026-0147',
    title: 'Potential oil spill detected',
    confidence: 92,
    area: '14.6 km²',
    severity: 'High',
    nearestVessel: 'MV Ocean Star',
    vesselDistance: '8.2 km',
    sensor: req.body.sensorType || 'SAR',
    location: req.body.location || 'Arabian Sea',
    coordinates: '19.0760° N, 72.8777° E',
    simulated: true
  }), 900)
})

// Satellite & AI Agent status APIs
app.get('/api/satellite/status', (_req, res) => {
  res.json({
    provider: 'NASA GIBS & MODIS Terra',
    status: 'online',
    date: new Date().toISOString().slice(0, 10),
    layers: ['MODIS_Terra_CorrectedReflectance_TrueColor', 'BlueMarble_NextGeneration', 'OpenStreetMap']
  })
})

app.get('/api/agent/status', (_req, res) => {
  res.json({
    ready: !!(process.env.XAI_API_KEY || process.env.OPENAI_API_KEY),
    provider: process.env.XAI_API_KEY ? 'xAI Grok Vision' : process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : 'Demo Vision Agent',
    model: process.env.XAI_VISION_MODEL || process.env.OPENAI_VISION_MODEL || 'grok-2-vision-1212'
  })
})

// Live AIS Vessels Endpoint
app.get('/api/vessels', async (_req, res) => {
  const vessels = [
    { id: 'v1', name: 'MV Ocean Star', type: 'Tanker', mmsi: '419001234', lat: 18.72, lon: 71.62, speed: 11.4, course: 238, risk: 82, status: 'Active', lastUpdate: '8 sec ago', trail: [[18.88,71.95],[18.82,71.83],[18.77,71.72],[18.72,71.62]] },
    { id: 'v2', name: 'MT Meridian', type: 'Cargo', mmsi: '419004521', lat: 19.46, lon: 72.18, speed: 9.8, course: 164, risk: 61, status: 'Active', lastUpdate: '12 sec ago', trail: [[19.22,72.02],[19.31,72.07],[19.40,72.13],[19.46,72.18]] },
    { id: 'v3', name: 'Seabird Explorer', type: 'Research', mmsi: '419006321', lat: 17.72, lon: 73.12, speed: 4.2, course: 78, risk: 28, status: 'Active', lastUpdate: '19 sec ago', trail: [[17.62,72.78],[17.66,72.91],[17.69,73.02],[17.72,73.12]] },
    { id: 'v4', name: 'Pacific Trader', type: 'Tanker', mmsi: '419007512', lat: 20.18, lon: 70.84, speed: 13.1, course: 315, risk: 19, status: 'Active', lastUpdate: '24 sec ago', trail: [[19.86,71.18],[19.96,71.08],[20.07,70.96],[20.18,70.84]] },
    { id: 'v5', name: 'Konkan Ferry', type: 'Passenger', mmsi: '419008888', lat: 18.28, lon: 72.93, speed: 18.6, course: 92, risk: 12, status: 'Active', lastUpdate: '6 sec ago', trail: [[18.27,72.72],[18.28,72.79],[18.28,72.86],[18.28,72.93]] },
    { id: 'v6', name: 'Bluefin 27', type: 'Fishing', mmsi: '419009127', lat: 16.92, lon: 72.54, speed: 6.7, course: 21, risk: 34, status: 'Active', lastUpdate: '31 sec ago', trail: [[16.78,72.48],[16.83,72.51],[16.88,72.53],[16.92,72.54]] },
  ]
  res.json(vessels)
})

app.get('/api/reports', async (_req, res) => { const data = await readData(); res.json(data.reports || []) })
app.post('/api/reports', async (req, res) => { const data = await readData(); const report = { id: `RP-${Date.now()}`, incidentId: req.body.incidentId || 'OS-2026-0147', createdAt: new Date().toISOString(), status: 'Ready', ...req.body }; (data.reports = data.reports || []).unshift(report); await writeData(data); res.status(201).json(report) })

// Direct Alert Endpoint for Analysis dispatch
app.post('/api/alerts', async (req, res) => {
  const data = await readData()
  if (!data.alerts) data.alerts = []
  const alertId = `ALT-2026-${Math.floor(1000 + Math.random() * 9000)}`
  const newAlert = {
    id: alertId,
    incidentId: req.body.incidentId || 'OS-2026-0147',
    agency: 'Indian Coast Guard (ICG) - MRCC Mumbai',
    agencyCode: 'ICG',
    priority: req.body.severity === 'Critical' ? 'Immediate' : 'Urgent',
    channel: 'API Webhook & Emergency Radio Broadcast',
    location: req.body.location || 'Arabian Sea',
    coordinates: '19.0760° N, 72.8777° E',
    area: req.body.area || '14.6 km²',
    confidence: req.body.confidence || 92,
    severity: req.body.severity || 'High',
    suspectedSource: 'MV Ocean Star',
    status: 'Dispatched',
    dispatchedAt: 'Just now',
    notes: req.body.message || 'Alert generated from satellite analysis workspace.',
    recipients: [
      { id: 'icg', name: 'Indian Coast Guard (ICG)', status: 'Dispatched' },
      { id: 'dgship', name: 'DG Shipping - Environment Cell', status: 'Dispatched' }
    ]
  }
  data.alerts.unshift(newAlert)
  await writeData(data)
  res.status(201).json(newAlert)
})

// Authority Alert Management Endpoints
app.get('/api/alerts', async (_req, res) => {
  const data = await readData()
  res.json(data.alerts || [])
})

app.post('/api/alerts/dispatch', async (req, res) => {
  const data = await readData()
  if (!data.alerts) data.alerts = []
  if (!data.messages) data.messages = []

  const newAlerts = []
  const newMessages = []
  const agencies = Array.isArray(req.body.agencies) && req.body.agencies.length > 0 
    ? req.body.agencies 
    : [req.body.agency || 'Indian Coast Guard (ICG) - MRCC Mumbai']

  for (const agency of agencies) {
    const alertId = `ALT-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const agencyName = typeof agency === 'string' ? agency : agency.name
    const agencyCode = typeof agency === 'object' && agency.code ? agency.code : 'ICG'

    const alert = {
      id: alertId,
      incidentId: req.body.incidentId || 'OS-2026-0147',
      agency: agencyName,
      agencyCode,
      priority: req.body.priority || 'Immediate',
      channel: req.body.channel || 'API Webhook & Emergency Radio Broadcast',
      location: req.body.location || 'Arabian Sea',
      coordinates: req.body.coordinates || '19.0760° N, 72.8777° E',
      area: req.body.area || '14.6 km²',
      confidence: req.body.confidence || 92,
      severity: req.body.severity || 'High',
      suspectedSource: req.body.suspectedSource || 'MV Ocean Star',
      status: 'Dispatched',
      dispatchedAt: 'Just now',
      acknowledgedAt: null,
      responseTeam: 'Command Center Alerted',
      notes: req.body.notes || 'Automated satellite anomaly alert sent to maritime authorities.',
      autoTriggered: !!req.body.autoTriggered
    }
    data.alerts.unshift(alert)
    newAlerts.push(alert)

    // Generate incoming acknowledgment message from the authority
    const ackMessage = {
      id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
      alertId,
      incidentId: req.body.incidentId || 'OS-2026-0147',
      agency: agencyName,
      agencyCode,
      sender: agencyCode === 'ICG' ? 'Duty Officer (MRCC Mumbai)' : agencyCode === 'INCOIS' ? 'Spill Modeling Cell' : 'Maritime Authority Ops',
      message: `ALERT RECEIVED: Emergency spill telemetry for ${req.body.location || 'Arabian Sea'} (${req.body.area || '14.6 km²'}) logged. Response protocol initiated.`,
      timestamp: 'Just now',
      type: 'acknowledgment'
    }
    data.messages.unshift(ackMessage)
    newMessages.push(ackMessage)
  }

  await writeData(data)
  res.status(201).json({ success: true, count: newAlerts.length, alerts: newAlerts, messages: newMessages })
})

app.patch('/api/alerts/:id', async (req, res) => {
  const data = await readData()
  if (!data.alerts) data.alerts = []
  const alert = data.alerts.find(a => a.id === req.params.id)
  if (!alert) return res.status(404).json({ message: 'Alert record not found' })

  Object.assign(alert, req.body, { updatedAt: new Date().toISOString() })
  if (req.body.status === 'Acknowledged' && !alert.acknowledgedAt) {
    alert.acknowledgedAt = 'Just now'
  }
  await writeData(data)
  res.json(alert)
})

app.get('/api/messages', async (_req, res) => {
  const data = await readData()
  res.json(data.messages || [])
})

app.listen(port, () => console.log(`Ocean Sentinel API listening on http://localhost:${port}`))
