import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Activity, AlertCircle, AlertTriangle, ArrowUpRight, Bell, Building2, Check,
  CheckCircle2, ChevronDown, Clock3, CloudSun, Crosshair, Download, Eye, FileText,
  Filter, Flame, Gauge, Layers3, LayoutDashboard, LocateFixed, Mail, Map as MapIcon, Menu,
  MessageSquare, MoreHorizontal, Navigation, Pause, Phone, Play, Radar, Radio,
  RotateCcw, Search, Send, Settings, ShieldAlert, ShieldCheck, Ship, Siren,
  SlidersHorizontal, Sparkles, Upload, UserRound, Waves, Wind, X, Zap,
} from 'lucide-react'

export type View = 'landing' | 'overview' | 'map' | 'analysis' | 'incident-detail' | 'incidents' | 'vessels' | 'reports' | 'alerts' | 'settings'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'
export type AlertPriority = 'Immediate' | 'Urgent' | 'High' | 'Routine'
export type AlertStatus = 'Dispatched' | 'Acknowledged' | 'Units Deployed' | 'Resolved'

export type Incident = {
  id: string
  location: string
  area: string
  confidence: number
  severity: Severity
  time: string
  status: string
  x: number
  y: number
  lat?: number
  lng?: number
  coordinates?: string
  nearestVessel?: string
  vesselDistance?: string
}

export type Vessel = {
  id: string
  name: string
  type: 'Tanker' | 'Cargo' | 'Passenger' | 'Fishing' | 'Research' | string
  mmsi: string
  lat: number
  lon: number
  speed: number
  course: number
  risk: number
  status: 'Active' | 'Stale' | 'Offline' | string
  lastUpdate: string
  trail: [number, number][]
}

export type MapMode = 'demo' | 'live'
export type LiveVessel = Vessel

export type AuthorityAgency = {
  id: string
  code: 'ICG' | 'DG_SHIPPING' | 'INCOIS' | 'SPCB' | 'NAVY' | 'PORT_TRUST'
  name: string
  fullName: string
  division: string
  contact: string
  channel: string
  region: string
}

export type AuthorityAlert = {
  id: string
  incidentId: string
  agency: string
  agencyCode: string
  priority: AlertPriority
  channel: string
  location: string
  coordinates: string
  area: string
  confidence: number
  severity: Severity
  suspectedSource?: string
  status: AlertStatus
  dispatchedAt: string
  acknowledgedAt?: string | null
  responseTeam?: string
  notes?: string
  autoTriggered?: boolean
}

export type AuthorityMessage = {
  id: string
  alertId: string
  incidentId: string
  agency: string
  agencyCode: string
  sender: string
  message: string
  timestamp: string
  type: 'acknowledgment' | 'dispatch_response' | 'sitrep_update'
}

export const AUTHORITIES_REGISTRY: AuthorityAgency[] = [
  {
    id: 'agency-icg',
    code: 'ICG',
    name: 'Indian Coast Guard (ICG)',
    fullName: 'Indian Coast Guard - Maritime Rescue Coordination Centre (MRCC)',
    division: 'Pollution Response Command & Coastal Patrol Wing',
    contact: 'Ops Hotline: 1554 / +91-22-24371932 | mrcc-mumbai@indiancoastguard.gov.in',
    channel: 'API Webhook & VHF CH-16 Broadcast',
    region: 'Western & Eastern Seaboard (Pan-India)',
  },
  {
    id: 'agency-dgshipping',
    code: 'DG_SHIPPING',
    name: 'Directorate General of Shipping',
    fullName: 'DG Shipping - Marine Environment Protection Cell',
    division: 'Vessel Compliance & Flag State Enforcement',
    contact: 'Phone: +91-22-25752040 | env-cell@dgshipping.gov.in',
    channel: 'Priority SMS & Official SITREP Email',
    region: 'All Major Ports & Indian EEZ',
  },
  {
    id: 'agency-incois',
    code: 'INCOIS',
    name: 'INCOIS (Ministry of Earth Sciences)',
    fullName: 'Indian National Centre for Ocean Information Services',
    division: 'Oil Spill Trajectory & Ocean State Forecast Center',
    contact: 'Helpline: +91-40-23895011 | spillmodel@incois.gov.in',
    channel: 'API Webhook (Automated Drift Simulation)',
    region: 'Indian Ocean, Arabian Sea, Bay of Bengal',
  },
  {
    id: 'agency-spcb',
    code: 'SPCB',
    name: 'State Pollution Control Board (SPCB)',
    fullName: 'Coastal State Pollution Control Board - Marine Wing',
    division: 'Coastal Zone Management & Ecological Defense',
    contact: 'Duty Officer: +91-22-24010437 | coastal-env@spcb.gov.in',
    channel: 'Official Email SITREP & SMS',
    region: 'Coastal Waterways (0-12 Nautical Miles)',
  },
  {
    id: 'agency-porttrust',
    code: 'PORT_TRUST',
    name: 'Port Trust & VTMS Command',
    fullName: 'Major Port Authority - Vessel Traffic Management (VTMS)',
    division: 'Harbour Master & Oil Spill Contingency Fleet',
    contact: 'VHF Ch 12/16 | VTMS Ops: +91-22-66564000',
    channel: 'VHF Emergency Broadcast & Webhook',
    region: 'Harbour Approaches, Anchorage & Fairway',
  },
  {
    id: 'agency-navy',
    code: 'NAVY',
    name: 'Indian Navy Coastal Security Cell',
    fullName: 'Naval Command - Maritime Domain Awareness Cell',
    division: 'Maritime Security & Deep Sea Reconnaissance',
    contact: 'Navy Maritime Ops: +91-22-22751000 | ops@navy.gov.in',
    channel: 'Encrypted Defence API & Tactical Link',
    region: 'Offshore Corridors & Exclusive Economic Zone',
  },
]

const initialIncidents: Incident[] = [
  { id: 'OS-2026-0147', location: 'Arabian Sea (Mumbai Offshore)', area: '14.6 km²', confidence: 92, severity: 'High', time: '18 min ago', status: 'Under review', x: 34, y: 42, lat: 18.9500, lng: 72.4500, coordinates: '18.9500° N, 72.4500° E', nearestVessel: 'MV Ocean Star', vesselDistance: '8.2 km' },
  { id: 'OS-2026-0148', location: 'Gulf of Kutch (Gujarat)', area: '4.2 km²', confidence: 78, severity: 'Medium', time: '1h 42m ago', status: 'New alert', x: 16, y: 27, lat: 22.5800, lng: 69.4500, coordinates: '22.5800° N, 69.4500° E', nearestVessel: 'MT Meridian', vesselDistance: '12.7 km' },
  { id: 'OS-2026-0149', location: 'Bay of Bengal (Chennai Offshore)', area: '28.1 km²', confidence: 96, severity: 'Critical', time: '3h 08m ago', status: 'Escalated', x: 76, y: 58, lat: 13.1500, lng: 80.4500, coordinates: '13.1500° N, 80.4500° E', nearestVessel: 'Seabird Explorer', vesselDistance: '18.4 km' },
  { id: 'OS-2026-0146', location: 'Mumbai Offshore (South)', area: '2.8 km²', confidence: 71, severity: 'Low', time: 'Yesterday', status: 'Resolved', x: 29, y: 66, lat: 18.7200, lng: 72.6200, coordinates: '18.7200° N, 72.6200° E', nearestVessel: 'Pacific Trader', vesselDistance: '24.1 km' },
]

export const initialVessels: Vessel[] = [
  { id: 'v1', name: 'MV Ocean Star', type: 'Tanker', mmsi: '419001234', lat: 18.72, lon: 71.62, speed: 11.4, course: 238, risk: 82, status: 'Active', lastUpdate: '8 sec ago', trail: [[18.88,71.95],[18.82,71.83],[18.77,71.72],[18.72,71.62]] },
  { id: 'v2', name: 'MT Meridian', type: 'Cargo', mmsi: '419004521', lat: 19.46, lon: 72.18, speed: 9.8, course: 164, risk: 61, status: 'Active', lastUpdate: '12 sec ago', trail: [[19.22,72.02],[19.31,72.07],[19.40,72.13],[19.46,72.18]] },
  { id: 'v3', name: 'Seabird Explorer', type: 'Research', mmsi: '419006321', lat: 17.72, lon: 73.12, speed: 4.2, course: 78, risk: 28, status: 'Active', lastUpdate: '19 sec ago', trail: [[17.62,72.78],[17.66,72.91],[17.69,73.02],[17.72,73.12]] },
  { id: 'v4', name: 'Pacific Trader', type: 'Tanker', mmsi: '419007512', lat: 20.18, lon: 70.84, speed: 13.1, course: 315, risk: 19, status: 'Active', lastUpdate: '24 sec ago', trail: [[19.86,71.18],[19.96,71.08],[20.07,70.96],[20.18,70.84]] },
  { id: 'v5', name: 'Konkan Ferry', type: 'Passenger', mmsi: '419008888', lat: 18.28, lon: 72.93, speed: 18.6, course: 92, risk: 12, status: 'Active', lastUpdate: '6 sec ago', trail: [[18.27,72.72],[18.28,72.79],[18.28,72.86],[18.28,72.93]] },
  { id: 'v6', name: 'Bluefin 27', type: 'Fishing', mmsi: '419009127', lat: 16.92, lon: 72.54, speed: 6.7, course: 21, risk: 34, status: 'Active', lastUpdate: '31 sec ago', trail: [[16.78,72.48],[16.83,72.51],[16.88,72.53],[16.92,72.54]] },
]
export const initialLiveVessels = initialVessels

const initialAlerts: AuthorityAlert[] = [
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
    notes: 'Containment booms deployed. Hydrodynamic spill trajectory model active.',
    autoTriggered: true,
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
    autoTriggered: true,
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
    autoTriggered: false,
  },
]

const initialMessages: AuthorityMessage[] = [
  {
    id: 'MSG-8801',
    alertId: 'ALT-2026-8801',
    incidentId: 'OS-2026-0149',
    agency: 'Indian Coast Guard (ICG) - MRCC Chennai',
    agencyCode: 'ICG',
    sender: 'Commander K. R. Nair (MRCC Ops)',
    message: 'ALERT RECEIVED & VERIFIED: Pollution response vessel ICGS Samudra Paheredar diverted to coordinates 13.0827° N, 80.2707° E with ocean booms.',
    timestamp: '2h 40m ago',
    type: 'dispatch_response',
  },
  {
    id: 'MSG-8802',
    alertId: 'ALT-2026-8802',
    incidentId: 'OS-2026-0147',
    agency: 'DG Shipping - Marine Environment Cell',
    agencyCode: 'DG_SHIPPING',
    sender: 'Capt. S. Sengupta (Flag State Officer)',
    message: 'NOTICE ACKNOWLEDGED: Emergency directive issued to MV Ocean Star master to hold position for environmental compliance check.',
    timestamp: '12 min ago',
    type: 'acknowledgment',
  },
]

const navItems: { id: View; label: string; icon: typeof Activity; badge?: boolean }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'alerts', label: '🚨 Authority Alerts', icon: Siren, badge: true },
  { id: 'map', label: 'Live map', icon: MapIcon },
  { id: 'analysis', label: 'Analyze image (Auto-Alert)', icon: Radar },
  { id: 'incidents', label: 'Incidents', icon: AlertCircle },
  { id: 'vessels', label: 'Vessel intelligence', icon: Ship },
  { id: 'reports', label: 'Reports', icon: FileText },
]

function App() {
  const [view, setView] = useState<View>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [selected, setSelected] = useState<Incident>(initialIncidents[0])
  const [incidentData, setIncidentData] = useState<Incident[]>(initialIncidents)
  const [alerts, setAlerts] = useState<AuthorityAlert[]>(initialAlerts)
  const [messages, setMessages] = useState<AuthorityMessage[]>(initialMessages)
  const [toast, setToast] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [dispatchTargetIncident, setDispatchTargetIncident] = useState<Incident>(initialIncidents[0])
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/health'),
      fetch('/api/incidents'),
      fetch('/api/alerts'),
      fetch('/api/messages'),
    ]).then(async ([health, incidentResponse, alertsResponse, messagesResponse]) => {
      if (!health.ok || !incidentResponse.ok) throw new Error('API unavailable')
      const remoteIncidents = await incidentResponse.json() as Incident[]
      if (remoteIncidents.length) {
        setIncidentData(remoteIncidents)
        setSelected(remoteIncidents[0])
      }
      if (alertsResponse.ok) {
        const remoteAlerts = await alertsResponse.json() as AuthorityAlert[]
        if (Array.isArray(remoteAlerts) && remoteAlerts.length > 0) {
          setAlerts(remoteAlerts)
        }
      }
      if (messagesResponse.ok) {
        const remoteMessages = await messagesResponse.json() as AuthorityMessage[]
        if (Array.isArray(remoteMessages) && remoteMessages.length > 0) {
          setMessages(remoteMessages)
        }
      }
      setApiOnline(true)
    }).catch(() => setApiOnline(false))
  }, [])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 4500)
  }

  const openIncident = (incident: Incident) => {
    setSelected(incident)
    setView('map')
  }

  const openDispatchModal = (incident?: Incident) => {
    setDispatchTargetIncident(incident || selected || incidentData[0])
    setDispatchModalOpen(true)
  }

  const handleDispatchAlert = async (
    targetIncident: Incident,
    selectedAgencyCodes: string[],
    channel: string,
    priority: AlertPriority,
    notes: string,
    autoTriggered = false
  ) => {
    const selectedAgencies = AUTHORITIES_REGISTRY.filter(a => selectedAgencyCodes.includes(a.code))
    const payload = {
      incidentId: targetIncident.id,
      location: targetIncident.location,
      coordinates: targetIncident.coordinates || '19.0760° N, 72.8777° E',
      area: targetIncident.area,
      confidence: targetIncident.confidence,
      severity: targetIncident.severity,
      suspectedSource: targetIncident.nearestVessel || 'MV Ocean Star',
      channel,
      priority,
      notes,
      autoTriggered,
      agencies: selectedAgencies.map(a => ({ name: `${a.name} - ${a.division}`, code: a.code })),
    }

    let createdAlerts: AuthorityAlert[] = []

    try {
      const res = await fetch('/api/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.alerts && Array.isArray(data.alerts)) {
          createdAlerts = data.alerts
          setAlerts(prev => [...data.alerts, ...prev])
        }
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(prev => [...data.messages, ...prev])
        }
      } else {
        throw new Error('API dispatch failed')
      }
    } catch {
      // Fallback local state creation
      createdAlerts = selectedAgencies.map(a => ({
        id: `ALT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        incidentId: targetIncident.id,
        agency: `${a.name} - ${a.division}`,
        agencyCode: a.code,
        priority,
        channel,
        location: targetIncident.location,
        coordinates: targetIncident.coordinates || '19.0760° N, 72.8777° E',
        area: targetIncident.area,
        confidence: targetIncident.confidence,
        severity: targetIncident.severity,
        suspectedSource: targetIncident.nearestVessel || 'MV Ocean Star',
        status: 'Dispatched',
        dispatchedAt: 'Just now',
        acknowledgedAt: null,
        responseTeam: 'Command Center Alerted',
        notes: notes || 'Emergency satellite detection alert dispatched.',
        autoTriggered,
      }))
      setAlerts(prev => [...createdAlerts, ...prev])
    }

    const agencyNames = selectedAgencies.map(a => a.name).join(', ')
    notify(`🚨 Alert dispatched to ${agencyNames}! Waiting for authority acknowledgment...`)
    setDispatchModalOpen(false)

    // SIMULATE INCOMING AUTHORITY ACKNOWLEDGMENT TRANSMISSION (After 2.5s)
    window.setTimeout(() => {
      const targetAgency = selectedAgencies[0] || AUTHORITIES_REGISTRY[0]
      const incomingAck: AuthorityMessage = {
        id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        alertId: createdAlerts[0]?.id || 'ALT-2026-NEW',
        incidentId: targetIncident.id,
        agency: targetAgency.name,
        agencyCode: targetAgency.code,
        sender: targetAgency.code === 'ICG' ? 'MRCC Mumbai Command (Duty Officer)' : `${targetAgency.name} Ops`,
        message: `📡 INCOMING TRANSMISSION: "Spill Alert ${targetIncident.id} in ${targetIncident.location} (${targetIncident.area}) RECEIVED & LOGGED at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC. Response units mobilized."`,
        timestamp: 'Just now',
        type: 'acknowledgment',
      }

      setMessages(prev => [incomingAck, ...prev])

      // Auto-update alert status to Acknowledged
      if (createdAlerts[0]) {
        setAlerts(prev => prev.map(a => {
          if (a.id === createdAlerts[0].id) {
            return { ...a, status: 'Acknowledged', acknowledgedAt: 'Just now' }
          }
          return a
        }))
      }

      notify(`📡 MESSAGE RECEIVED from ${targetAgency.name}: Alert ${targetIncident.id} Received & Logged!`)
    }, 2800)
  }

  const handleUpdateAlertStatus = async (alertId: string, nextStatus: AlertStatus) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          responseTeam: nextStatus === 'Units Deployed' ? 'ICGS Varad (Fast Patrol) & Containment Skimmers' : undefined,
        }),
      })
    } catch {
      // ignore
    }

    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          status: nextStatus,
          acknowledgedAt: nextStatus === 'Acknowledged' && !a.acknowledgedAt ? 'Just now' : a.acknowledgedAt,
          responseTeam: nextStatus === 'Units Deployed' ? 'ICGS Varad (Fast Patrol) & Containment Skimmers' : a.responseTeam,
        }
      }
      return a
    }))
    notify(`Alert ${alertId} status updated to ${nextStatus}`)
  }

  const activeAlertsCount = alerts.filter(a => a.status !== 'Resolved').length

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <button className="brand" onClick={() => setView('landing')}>
          <div className="brand-mark"><Waves size={21} /></div>
          <div><strong>OCEAN SENTINEL</strong><span>AI INTELLIGENCE</span></div>
        </button>
        <div className="demo-pill"><span /> DEMO ENVIRONMENT</div>

        {/* Emergency Alert Quick Broadcast Button in Sidebar */}
        <div className="sidebar-emergency-action">
          <button className="emergency-broadcast-btn" onClick={() => openDispatchModal(selected)}>
            <Siren size={16} className="emergency-icon-pulse" />
            <span>Emergency Alert</span>
            <small>Dispatch to Authorities</small>
          </button>
        </div>

        <p className="nav-label">Workspace</p>
        <nav>
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={view === id ? 'nav-item active' : 'nav-item'}
              onClick={() => { setView(id); setMobileNav(false) }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badge && activeAlertsCount > 0 && <b className="alert-badge-pill">{activeAlertsCount}</b>}
              {id === 'incidents' && <b>{incidentData.length}</b>}
            </button>
          ))}
        </nav>
        <p className="nav-label settings-label">System</p>
        <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
          <Settings size={17} />
          <span>Settings</span>
        </button>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="pulse-dot" />
            <div>
              <strong>{apiOnline ? 'API connected' : 'Demo mode active'}</strong>
              <small>{apiOnline ? 'Ocean Sentinel service online' : 'Local simulation ready'}</small>
            </div>
          </div>
          <div className="user-row">
            <div className="avatar">AK</div>
            <div>
              <strong>Arjun Kumar</strong>
              <small>Maritime analyst</small>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20} /></button>
          <div className="crumb">
            <span>Ocean Sentinel AI</span>
            <span>/</span>
            <strong>{view === 'landing' ? 'Welcome' : navItems.find(n => n.id === view)?.label || 'Settings'}</strong>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={16} />
              <input placeholder="Search incidents, alerts, vessels..." />
            </div>

            {/* Quick Dispatch Topbar Action */}
            <button className="top-alert-btn" onClick={() => openDispatchModal(selected)}>
              <Siren size={15} />
              <span>Alert Coast Guard</span>
            </button>

            <button className="icon-btn" onClick={() => { setView('alerts'); notify(`Viewing ${alerts.length} authority alert dispatches`) }} title="Authority Alerts">
              <Bell size={18} />
              {activeAlertsCount > 0 && <i />}
            </button>

            <div className="profile-wrap">
              <button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar small">AK</div>
                <span>Arjun Kumar</span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <strong>Arjun Kumar</strong>
                  <span>Analyst account</span>
                  <hr />
                  <button onClick={() => { setView('alerts'); setProfileOpen(false) }}>View Authority Alerts & Messages</button>
                  <button onClick={() => { setView('settings'); setProfileOpen(false) }}>Account & Alerts settings</button>
                  <button onClick={() => { notify('Signed out of demo'); setProfileOpen(false) }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {view === 'landing' && <Landing onNavigate={setView} onOpenDispatch={() => openDispatchModal(selected)} />}
        {view === 'overview' && <Overview onNavigate={setView} onIncident={openIncident} notify={notify} onOpenDispatch={openDispatchModal} alerts={alerts} messages={messages} />}
        {view === 'alerts' && <AuthorityAlerts alerts={alerts} messages={messages} onUpdateStatus={handleUpdateAlertStatus} onOpenDispatch={openDispatchModal} onViewIncident={openIncident} notify={notify} incidentData={incidentData} />}
        {view === 'map' && <MapView selected={selected} onSelect={setSelected} notify={notify} onViewDetail={() => setView('incident-detail')} onOpenDispatch={openDispatchModal} alerts={alerts} />}
        {view === 'analysis' && <Analysis notify={notify} onOpenDispatch={openDispatchModal} autoAlertEnabled={autoAlertEnabled} onAutoDispatchAlert={handleDispatchAlert} onNavigate={setView} />}
        {view === 'incident-detail' && <IncidentDetail incident={selected} notify={notify} onOpenDispatch={openDispatchModal} alerts={alerts} messages={messages} />}
        {view === 'incidents' && <Incidents incidents={incidentData} onSelect={openIncident} onOpenDispatch={openDispatchModal} />}
        {view === 'vessels' && <Vessels notify={notify} />}
        {view === 'reports' && <Reports notify={notify} />}
        {view === 'settings' && <SettingsView notify={notify} autoAlertEnabled={autoAlertEnabled} onToggleAutoAlert={() => setAutoAlertEnabled(!autoAlertEnabled)} />}

        <footer>
          Ocean Sentinel AI is a decision-support system. Oil spill detection & authority alerting feeds are integrated with Indian Coast Guard (ICG) MRCC & Maritime Environmental Protection protocols.
        </footer>
      </main>

      {/* Emergency Alert Dispatch Modal */}
      {dispatchModalOpen && (
        <AlertModal
          incident={dispatchTargetIncident || selected || incidentData[0] || initialIncidents[0]}
          incidents={incidentData && incidentData.length > 0 ? incidentData : initialIncidents}
          onClose={() => setDispatchModalOpen(false)}
          onDispatch={(incident, agencies, channel, priority, notes) => handleDispatchAlert(incident, agencies, channel, priority, notes, false)}
        />
      )}

      {toast && (
        <div className="toast">
          <ShieldAlert size={18} className="toast-icon" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="intro-copy">{description}</p>
      </div>
      {action}
    </div>
  )
}

function Landing({ onNavigate, onOpenDispatch }: { onNavigate: (v: View) => void; onOpenDispatch: () => void }) {
  return (
    <div className="landing page">
      <div className="landing-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="pulse-dot" /> SATELLITE INTELLIGENCE & AUTHORITY EMERGENCY DISPATCH</div>
          <h1>Detect ocean oil spills<br /><span>alert authorities instantly.</span></h1>
          <p>
            Ocean Sentinel AI automatically analyzes satellite radar (SAR) & optical scenes to identify hydrocarbon slicks, and dispatches automated emergency alerts to the Indian Coast Guard (ICG), DG Shipping, and INCOIS with instant confirmation.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => onNavigate('overview')}><Radar size={17} /> Launch dashboard <ArrowUpRight size={15} /></button>
            <button className="emergency-hero-btn" onClick={onOpenDispatch}><Siren size={16} /> Alert Authorities</button>
            <button className="ghost-btn" onClick={() => onNavigate('analysis')}><Play size={15} /> Test Image Analysis</button>
          </div>
          <div className="hero-proof">
            <span><strong>147</strong> detections reviewed</span>
            <span><strong>6</strong> maritime agencies connected</span>
            <span><strong>&lt; 5 min</strong> alert dispatch latency</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="radar-ring ring-one" />
          <div className="radar-ring ring-two" />
          <div className="radar-sweep" />
          <div className="orbit-dot dot-one" />
          <div className="orbit-dot dot-two" />
          <div className="globe">
            <div className="globe-line line-a" />
            <div className="globe-line line-b" />
            <div className="globe-line line-c" />
            <div className="globe-glow" />
          </div>
          <div className="scan-label"><span className="pulse-dot" /> 24/7 COAST GUARD UPLINK<span>MONITORING ARABIAN SEA & BAY OF BENGAL</span></div>
        </div>
      </div>

      <div className="landing-section-head">
        <div>
          <p className="eyebrow">End-to-End Spill Response</p>
          <h2>From satellite signal to authority mobilization.</h2>
        </div>
        <span>Real-time Multi-Agency Dispatch Architecture</span>
      </div>

      <div className="feature-grid">
        <Feature icon={<Radar />} number="01" title="Satellite anomaly detection" text="High-resolution SAR & optical satellite feeds scan corridors for oil slicks." />
        <Feature icon={<Sparkles />} number="02" title="AI spill segmentation" text="Estimate affected slick surface area (km²), drift vector, and model confidence." />
        <Feature icon={<Siren />} number="03" title="Instant Authority Alerting" text="Auto-dispatch emergency alerts to Indian Coast Guard MRCC, DG Shipping & INCOIS." />
        <Feature icon={<Ship />} number="04" title="Vessel correlation & containment" text="Correlate AIS tracking with suspected vessels and monitor response team deployment." />
      </div>

      {/* Direct Interactive Authority Alerting Showcase on Landing Page */}
      <div className="landing-authorities-showcase">
        <div className="showcase-header">
          <div className="showcase-title">
            <span className="pulse-dot" />
            <h3>🚨 Connected Maritime Authorities & Emergency Dispatch Grid</h3>
          </div>
          <div className="showcase-actions">
            <button className="emergency-action-btn" onClick={onOpenDispatch}>
              <Siren size={15} /> Open Emergency Dispatcher
            </button>
            <button className="primary-btn sm" onClick={() => onNavigate('alerts')}>
              Go to Authority Alert Center <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <div className="authorities-showcase-grid">
          {AUTHORITIES_REGISTRY.slice(0, 4).map(a => (
            <div className="showcase-agency-item" key={a.id} onClick={() => onNavigate('alerts')}>
              <div className="agency-icon-dot"><ShieldAlert size={16} /></div>
              <div>
                <strong>{a.name}</strong>
                <small>{a.division}</small>
                <span>{a.channel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="how-it-works">
        <div><p className="eyebrow">Automated workflow</p><h2>Swift action<br />when oil is in water.</h2></div>
        <div className="steps">
          <Step n="01" label="Satellite scene ingestion" />
          <Step n="02" label="AI spill detection" />
          <Step n="03" label="Emergency alert triggered" />
          <Step n="04" label="Authorities notified (ICG/INCOIS)" />
          <Step n="05" label="Containment teams deployed" />
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return (
    <div className="feature-card">
      <div className="feature-top"><span>{number}</span><div>{icon}</div></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowUpRight size={16} className="feature-arrow" />
    </div>
  )
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <div className="step">
      <span>{n}</span>
      <div><i /><strong>{label}</strong></div>
    </div>
  )
}

function Overview({ onNavigate, onIncident, notify, onOpenDispatch, alerts, messages }: {
  onNavigate: (v: View) => void
  onIncident: (i: Incident) => void
  notify: (s: string) => void
  onOpenDispatch: () => void
  alerts: AuthorityAlert[]
  messages: AuthorityMessage[]
}) {
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved')

  return (
    <div className="page">
      <PageIntro
        eyebrow="Maritime Operations Command · Live Feed"
        title="Good afternoon, Arjun."
        description="Real-time ocean surveillance, satellite spill intelligence, and emergency authority dispatch center."
        action={
          <div className="intro-actions">
            <button className="emergency-action-btn" onClick={onOpenDispatch}>
              <Siren size={16} /> Dispatch Authority Alert
            </button>
            <button className="primary-btn" onClick={() => onNavigate('analysis')}>
              <Sparkles size={16} /> New Satellite Analysis
            </button>
          </div>
        }
      />

      {/* Real-time Emergency Dispatch Banner */}
      <div className="emergency-status-banner">
        <div className="emergency-beacon"><Siren size={20} /></div>
        <div className="banner-info">
          <strong>🚨 Active Authority Alerting System Online</strong>
          <span>Connected to Indian Coast Guard (ICG) MRCC Mumbai/Chennai, DG Shipping, and INCOIS automated drift forecast.</span>
        </div>
        <div className="banner-stats">
          <div><small>Active Dispatches</small><strong>{activeAlerts.length}</strong></div>
          <button className="ghost-btn sm" onClick={() => onNavigate('alerts')}>
            View Alert Center <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Latest Incoming Transmission Alert */}
      {messages.length > 0 && (
        <div className="latest-message-banner">
          <div className="msg-icon"><Radio size={16} className="radar-spin" /></div>
          <div className="msg-content">
            <small>LATEST TRANSMISSION FROM AUTHORITIES · {messages[0].agency} ({messages[0].timestamp})</small>
            <p>{messages[0].message}</p>
          </div>
          <button className="ghost-btn sm" onClick={() => onNavigate('alerts')}>
            View Wire
          </button>
        </div>
      )}

      <div className="metric-grid">
        <Metric icon={<AlertCircle />} label="Total incidents" value="147" delta="+12.4%" detail="vs. last 30 days" tone="blue" />
        <Metric icon={<Siren />} label="Authority dispatches" value={`0${alerts.length}`} delta={`${activeAlerts.length} active`} detail="ICG & DG Shipping" tone="red" />
        <Metric icon={<Waves />} label="Area observed" value="24.8k" suffix="km²" delta="+8.1%" detail="Across 12 corridors" tone="cyan" />
        <Metric icon={<Ship />} label="Vessels near alerts" value="32" delta="6 flagged" detail="AIS correlation" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Detection & Alert activity</p>
              <h2>Spills detected & Authority Alerts over time</h2>
            </div>
            <select><option>Last 30 days</option><option>Last 7 days</option></select>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot blue" />All detections</span>
            <span><i className="legend-dot red" />Authority Alerts Dispatched</span>
          </div>
          <div className="line-chart">
            <div className="y-labels"><span>30</span><span>20</span><span>10</span><span>0</span></div>
            <svg viewBox="0 0 660 190" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#18c3d7" stopOpacity=".22" />
                  <stop offset="1" stopColor="#18c3d7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 148 C38 140 52 112 85 126 S130 146 158 106 S207 83 230 105 S269 130 292 84 S335 48 361 82 S405 105 425 65 S463 32 492 57 S531 78 554 38 S606 53 660 13 V190 H0Z" fill="url(#area)" />
              <path d="M0 148 C38 140 52 112 85 126 S130 146 158 106 S207 83 230 105 S269 130 292 84 S335 48 361 82 S405 105 425 65 S463 32 492 57 S531 78 554 38 S606 53 660 13" fill="none" stroke="#29c8d8" strokeWidth="3" />
              <path d="M0 171 C50 163 77 168 112 158 S169 150 198 162 S246 152 274 163 S332 133 363 151 S410 144 440 157 S491 135 522 147 S588 110 660 133" fill="none" stroke="#f26a63" strokeWidth="2" strokeDasharray="5 5" />
            </svg>
            <div className="x-labels"><span>01 Aug</span><span>08 Aug</span><span>15 Aug</span><span>22 Aug</span><span>27 Aug</span></div>
          </div>
        </section>

        <section className="panel severity-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Risk profile</p>
              <h2>Severity & Authority Alert Status</h2>
            </div>
            <button className="more-btn"><MoreHorizontal size={18} /></button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div><strong>{alerts.length}</strong><span>alerts</span></div>
            </div>
            <div className="donut-key">
              <KeyRow color="#ee5f58" label="Units Deployed" value="1" percent="33%" />
              <KeyRow color="#f3a644" label="Acknowledged" value="1" percent="33%" />
              <KeyRow color="#29c8d8" label="Dispatched" value="1" percent="33%" />
              <KeyRow color="#467c91" label="Resolved" value="0" percent="0%" />
            </div>
          </div>
          <div className="source-strip">
            <span>Dispatched Channels</span>
            <strong>API <em>45%</em></strong>
            <strong>VHF/Radio <em>35%</em></strong>
            <strong>SMS <em>20%</em></strong>
          </div>
        </section>
      </div>

      {/* Recent Dispatched Alerts Table */}
      <section className="panel alerts-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Emergency Response</p>
            <h2>Recent Authority Dispatches</h2>
          </div>
          <button className="text-btn" onClick={() => onNavigate('alerts')}>
            Go to Authority Alert Center <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="alert-list">
          {alerts.slice(0, 3).map(a => (
            <div className="authority-alert-row" key={a.id}>
              <div className={`severity-mark ${a.severity.toLowerCase()}`} />
              <div className="alert-agency-info">
                <strong>{a.agency}</strong>
                <span>Ref Incident: <em>{a.incidentId}</em> · {a.location}</span>
              </div>
              <div className="alert-channel-badge">
                <Radio size={13} />
                <span>{a.channel}</span>
              </div>
              <div className="alert-priority-tag">
                <span className={`priority-tag ${a.priority.toLowerCase()}`}>{a.priority} Priority</span>
              </div>
              <div className="alert-status-pill">
                <span className={`status-pill ${a.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <i />{a.status}
                </span>
              </div>
              <div className="alert-time"><Clock3 size={14} />{a.dispatchedAt}</div>
              <button className="ghost-btn sm" onClick={() => onNavigate('alerts')}>View</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({ icon, label, value, suffix, delta, detail, tone }: {
  icon: React.ReactNode; label: string; value: string; suffix?: string; delta: string; detail: string; tone: string
}) {
  return (
    <div className="metric">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-label">{label}<span>{detail}</span></div>
      <div className="metric-value">{value}<small>{suffix}</small></div>
      <div className="metric-delta">{delta}</div>
    </div>
  )
}

function KeyRow({ color, label, value, percent }: { color: string; label: string; value: string; percent: string }) {
  return (
    <div className="key-row">
      <i style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{percent}</small>
    </div>
  )
}

function Status({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`status ${severity.toLowerCase()}`}><i />{children}</span>
}

/* =========================================================================
   AUTHORITY ALERTS CENTER VIEW
   ========================================================================= */
function AuthorityAlerts({
  alerts,
  messages,
  onUpdateStatus,
  onOpenDispatch,
  onViewIncident,
  notify,
  incidentData,
}: {
  alerts: AuthorityAlert[]
  messages: AuthorityMessage[]
  onUpdateStatus: (id: string, status: AlertStatus) => void
  onOpenDispatch: () => void
  onViewIncident: (i: Incident) => void
  notify: (s: string) => void
  incidentData: Incident[]
}) {
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [filterAgency, setFilterAgency] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'dispatches' | 'wire'>('dispatches')

  const filteredAlerts = alerts.filter(a => {
    const matchStatus = filterStatus === 'All' || a.status === filterStatus
    const matchAgency = filterAgency === 'All' || a.agencyCode === filterAgency
    const matchSearch =
      searchQuery === '' ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.incidentId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchAgency && matchSearch
  })

  const deployedCount = alerts.filter(a => a.status === 'Units Deployed').length
  const ackCount = alerts.filter(a => a.status === 'Acknowledged').length
  const pendingCount = alerts.filter(a => a.status === 'Dispatched').length

  return (
    <div className="page authority-alerts-page">
      <PageIntro
        eyebrow="Emergency Operations Command · Multi-Agency Uplink"
        title="Authority Alerts & Emergency Dispatch"
        description="Automated & manual dispatch pipeline to Indian Coast Guard (ICG), DG Shipping, INCOIS, and Coastal Port Authorities with live acknowledgment messages."
        action={
          <div className="intro-actions">
            <button className="ghost-btn" onClick={() => notify('Emergency transmission channels re-synced')}>
              <Radio size={16} /> Re-sync VHF & API
            </button>
            <button className="emergency-action-btn" onClick={onOpenDispatch}>
              <Siren size={16} /> + New Emergency Dispatch
            </button>
          </div>
        }
      />

      {/* Real-time Ticker */}
      <div className="emergency-ticker-strip">
        <div className="ticker-badge"><Radio size={14} className="radar-spin" /> LIVE SATELLITE DISPATCH UPLINK</div>
        <div className="ticker-text">
          <span>🟢 MRCC Mumbai (1554): ONLINE</span>
          <span>🟢 DG Shipping Env Cell: CONNECTED</span>
          <span>🟢 INCOIS Spill Trajectory Server: ACTIVE</span>
          <span>🟢 NAVTEX Ch 518 kHz: BROADCASTING</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="authority-kpi-grid">
        <div className="kpi-card danger">
          <div className="kpi-icon"><Siren size={20} /></div>
          <div className="kpi-body">
            <span>Pending Acknowledgment</span>
            <strong>{pendingCount} Alerts</strong>
            <small>Requires immediate agency receipt</small>
          </div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon"><ShieldCheck size={20} /></div>
          <div className="kpi-body">
            <span>Acknowledged by Authorities</span>
            <strong>{ackCount} Agencies</strong>
            <small>Action plans under review</small>
          </div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon"><Ship size={20} /></div>
          <div className="kpi-body">
            <span>Response Units Deployed</span>
            <strong>{deployedCount} Containment Teams</strong>
            <small>Pollution control vessels on scene</small>
          </div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-icon"><MessageSquare size={20} /></div>
          <div className="kpi-body">
            <span>Authority Comm Transmissions</span>
            <strong>{messages.length} Messages</strong>
            <small>Official responses & SITREPs</small>
          </div>
        </div>
      </div>

      {/* Center Tabs: Dispatches vs Live Authority Comm Wire */}
      <div className="alerts-center-tabs">
        <button
          className={`tab-btn ${activeTab === 'dispatches' ? 'active' : ''}`}
          onClick={() => setActiveTab('dispatches')}
        >
          <Siren size={15} /> Active Dispatches ({alerts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'wire' ? 'active' : ''}`}
          onClick={() => setActiveTab('wire')}
        >
          <Radio size={15} /> Authority Transmission Wire & Messages ({messages.length})
        </button>
      </div>

      {activeTab === 'wire' ? (
        <div className="authority-messages-wire">
          <div className="wire-head">
            <div>
              <h3><Radio size={16} /> Official Maritime Authority Transmission Log</h3>
              <p>Real-time telemetry receipts, acknowledgment notices, and vessel mobilization directives sent by authorities.</p>
            </div>
            <button className="primary-btn sm" onClick={onOpenDispatch}><Send size={14} /> Send Message / Dispatch</button>
          </div>

          <div className="messages-stream">
            {messages.map(msg => (
              <div className="wire-message-card" key={msg.id}>
                <div className="msg-top">
                  <div className="msg-sender-pill">
                    <Radio size={13} />
                    <strong>{msg.agency}</strong>
                    <span>({msg.sender})</span>
                  </div>
                  <span className="msg-time"><Clock3 size={12} /> {msg.timestamp}</span>
                </div>
                <p className="msg-text">{msg.message}</p>
                <div className="msg-footer">
                  <span>Ref Alert: <strong>{msg.alertId}</strong></span>
                  <span>Incident: <strong>{msg.incidentId}</strong></span>
                  <span className="receipt-verified"><CheckCircle2 size={12} /> Receipt Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="filter-row alert-center-filters">
            <div className="search compact">
              <Search size={15} />
              <input
                placeholder="Search by Alert ID, Agency, Location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Dispatched">Dispatched (Pending Ack)</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Units Deployed">Units Deployed</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}>
              <option value="All">All Maritime Authorities</option>
              <option value="ICG">Indian Coast Guard (ICG)</option>
              <option value="DG_SHIPPING">DG Shipping</option>
              <option value="INCOIS">INCOIS (MoES)</option>
              <option value="SPCB">State Pollution Control Board</option>
              <option value="PORT_TRUST">Port Trust & VTMS</option>
              <option value="NAVY">Indian Navy</option>
            </select>
            <span className="results-counter">Showing {filteredAlerts.length} of {alerts.length} dispatches</span>
          </div>

          {/* Alerts Cards List */}
          <div className="alerts-full-list">
            {filteredAlerts.map(alert => {
              const matchingIncident = incidentData.find(i => i.id === alert.incidentId)
              const relatedMessages = messages.filter(m => m.alertId === alert.id || m.incidentId === alert.incidentId)

              return (
                <div className={`alert-detail-card ${alert.priority.toLowerCase()}`} key={alert.id}>
                  <div className="card-top-row">
                    <div className="agency-badge-group">
                      <div className="agency-avatar">
                        {alert.agencyCode === 'ICG' && <ShieldAlert size={18} />}
                        {alert.agencyCode === 'DG_SHIPPING' && <Ship size={18} />}
                        {alert.agencyCode === 'INCOIS' && <Waves size={18} />}
                        {alert.agencyCode === 'SPCB' && <Building2 size={18} />}
                        {alert.agencyCode === 'PORT_TRUST' && <Radio size={18} />}
                        {alert.agencyCode === 'NAVY' && <ShieldCheck size={18} />}
                      </div>
                      <div>
                        <div className="agency-title-row">
                          <h3>{alert.agency}</h3>
                          <span className={`priority-tag ${alert.priority.toLowerCase()}`}>{alert.priority} Priority</span>
                          {alert.autoTriggered && <span className="auto-pill"><Sparkles size={11} /> Auto-Dispatched</span>}
                        </div>
                        <p className="alert-meta-sub">
                          Dispatch ID: <strong>{alert.id}</strong> · Ref Incident: <strong className="clickable-link" onClick={() => matchingIncident && onViewIncident(matchingIncident)}>{alert.incidentId}</strong> · Dispatched {alert.dispatchedAt}
                        </p>
                      </div>
                    </div>

                    <div className="alert-status-block">
                      <span className={`status-pill large ${alert.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        <i />{alert.status}
                      </span>
                      {alert.acknowledgedAt && <small className="ack-time">Ack at: {alert.acknowledgedAt}</small>}
                    </div>
                  </div>

                  <div className="card-body-grid">
                    <div className="info-cell">
                      <small>Location & Coordinates</small>
                      <strong>{alert.location}</strong>
                      <span>{alert.coordinates}</span>
                    </div>
                    <div className="info-cell">
                      <small>Slick Area & Confidence</small>
                      <strong>{alert.area}</strong>
                      <span>{alert.confidence}% AI Confidence</span>
                    </div>
                    <div className="info-cell">
                      <small>Suspected Source / Vessel</small>
                      <strong>{alert.suspectedSource || 'Under Investigation'}</strong>
                      <span>AIS Proximity Vector</span>
                    </div>
                    <div className="info-cell">
                      <small>Dispatch Channel</small>
                      <strong>{alert.channel}</strong>
                      <span>Encrypted Payload Sent</span>
                    </div>
                  </div>

                  {alert.notes && (
                    <div className="alert-notes-box">
                      <strong>Operational SITREP / Directives:</strong>
                      <p>{alert.notes}</p>
                    </div>
                  )}

                  {/* Incoming Authority Messages for this Alert */}
                  {relatedMessages.length > 0 && (
                    <div className="alert-replies-section">
                      <strong><MessageSquare size={13} /> Authority Transmission History ({relatedMessages.length}):</strong>
                      {relatedMessages.map(rm => (
                        <div className="reply-bubble" key={rm.id}>
                          <div className="reply-meta">
                            <span className="reply-sender">{rm.sender}</span>
                            <span className="reply-time">{rm.timestamp}</span>
                          </div>
                          <p>{rm.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {alert.responseTeam && alert.status !== 'Dispatched' && (
                    <div className="response-team-box">
                      <Ship size={15} />
                      <span>Assigned Response Asset: <strong>{alert.responseTeam}</strong></span>
                    </div>
                  )}

                  <div className="card-actions-bar">
                    <div className="action-buttons-left">
                      {alert.status === 'Dispatched' && (
                        <button className="primary-btn sm" onClick={() => onUpdateStatus(alert.id, 'Acknowledged')}>
                          <Check size={14} /> Simulate Authority Acknowledgment
                        </button>
                      )}
                      {alert.status === 'Acknowledged' && (
                        <button className="primary-btn sm mobilize-btn" onClick={() => onUpdateStatus(alert.id, 'Units Deployed')}>
                          <Ship size={14} /> Deploy Response Units (Booms & Skimmers)
                        </button>
                      )}
                      {alert.status === 'Units Deployed' && (
                        <button className="ghost-btn sm" onClick={() => onUpdateStatus(alert.id, 'Resolved')}>
                          <CheckCircle2 size={14} /> Mark Incident Response Resolved
                        </button>
                      )}
                    </div>

                    <div className="action-buttons-right">
                      {matchingIncident && (
                        <button className="ghost-btn sm" onClick={() => onViewIncident(matchingIncident)}>
                          <MapIcon size={14} /> View On Map
                        </button>
                      )}
                      <button className="ghost-btn sm" onClick={() => notify(`Official SITREP package for ${alert.id} exported`)}>
                        <Download size={14} /> Export SITREP PDF
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredAlerts.length === 0 && (
              <div className="empty-alerts-state">
                <ShieldCheck size={36} />
                <h3>No Authority Alerts Match the Filter</h3>
                <p>Try clearing your search query or dispatch a new emergency alert to maritime authorities.</p>
                <button className="primary-btn" onClick={onOpenDispatch}><Siren size={15} /> Dispatch New Alert</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* =========================================================================
   EMERGENCY DISPATCH MODAL
   ========================================================================= */
function AlertModal({
  incident,
  incidents = [],
  onClose,
  onDispatch,
}: {
  incident?: Incident
  incidents?: Incident[]
  onClose: () => void
  onDispatch: (
    incident: Incident,
    selectedAgencies: string[],
    channel: string,
    priority: AlertPriority,
    notes: string
  ) => void
}) {
  const fallbackIncident: Incident = incidents[0] || initialIncidents[0]
  const currentIncident: Incident = incident || fallbackIncident
  const [selectedIncidentId, setSelectedIncidentId] = useState(currentIncident?.id || fallbackIncident.id)
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>(['ICG', 'DG_SHIPPING', 'INCOIS'])
  const [priority, setPriority] = useState<AlertPriority>('Immediate')
  const [channel, setChannel] = useState('API Webhook & Emergency VHF/Radio Broadcast')
  const [notes, setNotes] = useState(
    `Urgent: AI satellite detection identified potential ${(currentIncident?.severity || 'High').toLowerCase()} oil slick (${currentIncident?.area || '14.6 km²'}) in ${currentIncident?.location || 'Arabian Sea'}. Immediate containment protocol recommended.`
  )
  const [transmitting, setTransmitting] = useState(false)

  const activeIncident: Incident = incidents.find(i => i.id === selectedIncidentId) || currentIncident || fallbackIncident

  const toggleAgency = (code: string) => {
    if (selectedAgencies.includes(code)) {
      if (selectedAgencies.length > 1) {
        setSelectedAgencies(selectedAgencies.filter(c => c !== code))
      }
    } else {
      setSelectedAgencies([...selectedAgencies, code])
    }
  }

  const handleSend = () => {
    setTransmitting(true)
    setTimeout(() => {
      onDispatch(activeIncident, selectedAgencies, channel, priority, notes)
      setTransmitting(false)
    }, 1200)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="dispatch-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header emergency-modal-head">
          <div className="modal-title-with-icon">
            <div className="emergency-icon-wrap"><Siren size={22} className="emergency-icon-pulse" /></div>
            <div>
              <p className="eyebrow red-eyebrow">🚨 Emergency Response Protocol</p>
              <h2>Dispatch Alert to Maritime Authorities</h2>
            </div>
          </div>
          <button className="more-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body-scroll">
          {/* Target Incident Selection */}
          <div className="modal-section">
            <label className="section-label">Target Incident / Oil Spill Anomaly</label>
            <select
              className="incident-picker"
              value={selectedIncidentId}
              onChange={e => {
                setSelectedIncidentId(e.target.value)
                const inc = incidents.find(i => i.id === e.target.value)
                if (inc) {
                  setNotes(`Urgent: AI satellite detection identified potential ${(inc.severity || 'High').toLowerCase()} oil slick (${inc.area || '14.6 km²'}) in ${inc.location || 'Arabian Sea'}. Immediate containment protocol recommended.`)
                }
              }}
            >
              {(incidents.length ? incidents : initialIncidents).map(i => (
                <option key={i.id} value={i.id}>
                  {i.id} · {i.location} · {i.area} ({i.severity || 'High'} - {i.confidence || 90}% Confidence)
                </option>
              ))}
            </select>
          </div>

          {/* Incident Quick Summary Banner */}
          <div className="incident-summary-card">
            <div><span>Location</span><strong>{activeIncident?.location || 'Arabian Sea'}</strong></div>
            <div><span>Coordinates</span><strong>{activeIncident?.coordinates || '19.0760° N, 72.8777° E'}</strong></div>
            <div><span>Area</span><strong>{activeIncident?.area || '14.6 km²'}</strong></div>
            <div><span>Severity</span><strong className={`severity-text ${(activeIncident?.severity || 'High').toLowerCase()}`}>{activeIncident?.severity || 'High'} ({activeIncident?.confidence || 92}%)</strong></div>
            <div><span>Nearest Vessel</span><strong>{activeIncident?.nearestVessel || 'MV Ocean Star'}</strong></div>
          </div>

          {/* Authorities Selection */}
          <div className="modal-section">
            <label className="section-label">Select Maritime & Environmental Authorities to Notify (Multi-Agency)</label>
            <div className="authorities-selection-grid">
              {AUTHORITIES_REGISTRY.map(agency => {
                const isSelected = selectedAgencies.includes(agency.code)
                return (
                  <div
                    key={agency.id}
                    className={`agency-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAgency(agency.code)}
                  >
                    <div className="agency-choice-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAgency(agency.code)}
                      />
                    </div>
                    <div className="agency-choice-content">
                      <strong>{agency.name}</strong>
                      <small>{agency.division}</small>
                      <span className="agency-contact-pill">{agency.contact}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dispatch Channel & Priority */}
          <div className="form-row-two-col">
            <label>
              Dispatch Channel
              <select value={channel} onChange={e => setChannel(e.target.value)}>
                <option>API Webhook & Emergency VHF/Radio Broadcast</option>
                <option>Emergency SMS & Official SITREP Email</option>
                <option>NAVTEX Ch 518 kHz Marine Safety Broadcast</option>
                <option>Automated REST Webhook (NDMA / MRCC Portal)</option>
              </select>
            </label>
            <label>
              Priority Level
              <select value={priority} onChange={e => setPriority(e.target.value as AlertPriority)}>
                <option value="Immediate">Immediate (Flash - 15 min response)</option>
                <option value="Urgent">Urgent (High Priority - 45 min response)</option>
                <option value="High">High (Standard Maritime Alert)</option>
                <option value="Routine">Routine (Informational Brief)</option>
              </select>
            </label>
          </div>

          {/* SITREP Directive Notes */}
          <div className="modal-section">
            <label className="section-label">SITREP Operational Notes & Directives</label>
            <textarea
              className="notes-input"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add containment directives, wind/tide warnings, or specific requests for Coast Guard..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-btn" onClick={onClose} disabled={transmitting}>Cancel</button>
          <button className="emergency-dispatch-submit-btn" onClick={handleSend} disabled={transmitting}>
            {transmitting ? (
              <>
                <span className="spinner" /> Encrypting & Dispatching Alert...
              </>
            ) : (
              <>
                <Send size={15} /> Transmit Emergency Alert to {selectedAgencies.length} Authorities
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   LIVE MARITIME & SATELLITE MAP (LEAFLET POWERED)
   ========================================================================= */
function MapView({
  selected,
  onSelect,
  notify,
  onViewDetail,
  onOpenDispatch,
  alerts,
}: {
  selected: Incident
  onSelect: (i: Incident) => void
  notify: (s: string) => void
  onViewDetail: () => void
  onOpenDispatch: (i: Incident) => void
  alerts: AuthorityAlert[]
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const layersRef = useRef<{
    vessels: L.LayerGroup | null
    trails: L.LayerGroup | null
    incidents: L.LayerGroup | null
    baseOsm?: L.TileLayer | null
    baseGibs?: L.TileLayer | null
    baseBlue?: L.TileLayer | null
    baseDark?: L.TileLayer | null
  }>({ vessels: null, trails: null, incidents: null })

  const [satLayer, setSatLayer] = useState<'osm' | 'gibs' | 'blue' | 'dark'>('osm')
  const [satStatus, setSatStatus] = useState<string>('NASA GIBS (Live)')
  const [vessels, setVessels] = useState<Vessel[]>(initialVessels)
  const [selectedVessel, setSelectedVessel] = useState<Vessel>(initialVessels[0])
  const [mode, setMode] = useState<MapMode>('demo')
  const [vesselFilter, setVesselFilter] = useState('All vessels')
  const [showTrails, setShowTrails] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Initialize Leaflet Map with Base Satellite Layers
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 4,
      maxZoom: 14,
    }).setView([18.4, 72.5], 6)

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    })

    const time = new Date().toISOString().slice(0, 10)
    const gibs = L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      { attribution: 'NASA GIBS / EOSDIS', maxZoom: 9, opacity: 0.95 }
    )

    const blueMarble = L.tileLayer(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
      { attribution: 'NASA GIBS', maxZoom: 8 }
    )

    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    })

    osm.addTo(map)
    layersRef.current.baseOsm = osm
    layersRef.current.baseGibs = gibs
    layersRef.current.baseBlue = blueMarble
    layersRef.current.baseDark = dark

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    layersRef.current.vessels = L.layerGroup().addTo(map)
    layersRef.current.trails = L.layerGroup().addTo(map)
    layersRef.current.incidents = L.layerGroup().addTo(map)

    leafletRef.current = map
    setMapReady(true)
    setTimeout(() => map.invalidateSize(), 150)

    fetch('/api/satellite/status')
      .then(r => r.json())
      .then(s => setSatStatus(s.provider || 'NASA GIBS & MODIS Terra'))
      .catch(() => setSatStatus('NASA GIBS (Active)'))

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, [])

  // Switch Base Layers dynamically
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !layersRef.current.baseOsm) return
    const { baseOsm, baseGibs, baseBlue, baseDark } = layersRef.current

    ;[baseOsm, baseGibs, baseBlue, baseDark].forEach(l => {
      if (l && map.hasLayer(l)) map.removeLayer(l)
    })

    if (mode === 'live' && satLayer === 'gibs' && baseGibs) baseGibs.addTo(map)
    else if (mode === 'live' && satLayer === 'blue' && baseBlue) baseBlue.addTo(map)
    else if (satLayer === 'dark' && baseDark) baseDark.addTo(map)
    else if (baseOsm) baseOsm.addTo(map)
  }, [mode, satLayer, mapReady])

  // Demo Mode: Animated live vessel course vector updates
  useEffect(() => {
    if (mode !== 'demo') return
    const timer = window.setInterval(() => {
      setVessels(current =>
        current.map(v => {
          const distance = v.speed * 0.000025
          const rad = (v.course * Math.PI) / 180
          const lat = v.lat + Math.cos(rad) * distance
          const lon = v.lon + Math.sin(rad) * distance
          const trail = [...v.trail, [lat, lon] as [number, number]].slice(-16)
          return { ...v, lat, lon, trail, lastUpdate: 'just now' }
        })
      )
      setLastUpdate(new Date())
    }, 2500)
    return () => window.clearInterval(timer)
  }, [mode])

  // Live Mode: Poll /api/vessels every 5 seconds
  useEffect(() => {
    if (mode !== 'live') return
    let stopped = false
    const poll = async () => {
      try {
        const res = await fetch('/api/vessels')
        if (!res.ok) throw new Error('No live vessel API')
        const remote = await res.json()
        const list = Array.isArray(remote) ? remote : remote?.vessels || []
        if (!stopped && Array.isArray(list) && list.length) {
          setVessels(list)
          setLastUpdate(new Date())
        }
      } catch {
        if (!stopped) notify('Live API unavailable. Showing last known vessel positions.')
      }
    }
    poll()
    const timer = window.setInterval(poll, 5000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [mode, notify])

  // Render & Update Vessel, Trail, and Incident Markers
  useEffect(() => {
    const map = leafletRef.current
    if (!map) return

    layersRef.current.vessels?.clearLayers()
    layersRef.current.trails?.clearLayers()
    layersRef.current.incidents?.clearLayers()

    const filtered = vesselFilter === 'All vessels' ? vessels : vessels.filter(v => v.type === vesselFilter)

    if (showTrails) {
      filtered.forEach(v => {
        if (v.trail && v.trail.length > 1) {
          L.polyline(v.trail, {
            color: '#4ccbd0',
            weight: 2,
            opacity: 0.6,
            dashArray: '5 7',
          }).addTo(layersRef.current.trails!)
        }
      })
    }

    filtered.forEach(v => {
      const selectedClass = selectedVessel.id === v.id ? ' vessel-pin-selected' : ''
      const icon = L.divIcon({
        className: 'leaflet-vessel-wrapper',
        html: `<div class="leaflet-vessel-pin${selectedClass}" style="transform: rotate(${v.course}deg)"><span>▲</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      const marker = L.marker([v.lat, v.lon], { icon }).addTo(layersRef.current.vessels!)
      marker.bindTooltip(
        `<strong>${v.name}</strong><br>${v.type} · ${v.speed.toFixed(1)} kn`,
        { direction: 'top', offset: [0, -12] }
      )
      marker.on('click', () => setSelectedVessel(v))
    })

    if (showIncidents) {
      initialIncidents.forEach(i => {
        const hasAlert = alerts.some(a => a.incidentId === i.id)
        const lat = i.lat || (19.0760 + (i.y - 50) * 0.055)
        const lng = i.lng || (72.8777 + (i.x - 50) * 0.07)

        const icon = L.divIcon({
          className: 'leaflet-incident-wrapper',
          html: `<div class="leaflet-incident-pin ${i.severity.toLowerCase()} ${selected.id === i.id ? 'selected' : ''}"><span>${hasAlert ? '🚨' : i.severity === 'Critical' ? '!' : '•'}</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })
        const marker = L.marker([lat, lng], { icon }).addTo(layersRef.current.incidents!)
        marker.bindTooltip(`<strong>${i.id}</strong><br>${i.location} · ${i.severity}`, {
          direction: 'top',
          offset: [0, -12],
        })
        marker.on('click', () => onSelect(i))
      })
    }
  }, [vessels, vesselFilter, showTrails, showIncidents, selectedVessel, selected, alerts, onSelect])

  const focusVessel = () => {
    if (leafletRef.current) {
      leafletRef.current.flyTo([selectedVessel.lat, selectedVessel.lon], 9, { duration: 0.8 })
    }
  }

  return (
    <div className="page map-page">
      <PageIntro
        eyebrow={`Geospatial intelligence · ${mode === 'demo' ? 'Simulated AIS' : 'Live API mode'}`}
        title="Live ocean map & Satellite Feed"
        description="Track vessel movement, live satellite imagery, hydrodynamic vessel trails, and marine incidents on one operational map."
        action={
          <div className="map-mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`mode-btn ${mode === 'demo' ? 'active' : ''}`}
              onClick={() => {
                setMode('demo')
                setSatLayer('osm')
              }}
            >
              <Play size={13} /> Demo
            </button>
            <button
              className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => {
                setMode('live')
                setSatLayer('gibs')
              }}
            >
              <Zap size={13} /> Live sat
            </button>
            <select
              className="table-filter"
              value={satLayer}
              onChange={e => setSatLayer(e.target.value as any)}
            >
              <option value="gibs">🛰️ MODIS Terra (NASA GIBS)</option>
              <option value="blue">🌍 NASA Blue Marble</option>
              <option value="dark">🌑 CartoDB Dark Matter</option>
              <option value="osm">🗺️ OpenStreetMap</option>
            </select>
            <span className="format-note" style={{ marginLeft: 4 }}>
              <ShieldCheck size={14} /> {satStatus}
            </span>
          </div>
        }
      />

      <div className="map-toolbar">
        <div className="filter-row">
          <select value={vesselFilter} onChange={e => setVesselFilter(e.target.value)}>
            <option>All vessels</option>
            <option>Tanker</option>
            <option>Cargo</option>
            <option>Passenger</option>
            <option>Fishing</option>
            <option>Research</option>
          </select>
          <button
            className={`filter-btn ${showTrails ? 'active' : ''}`}
            onClick={() => setShowTrails(!showTrails)}
          >
            <Navigation size={14} /> Trails
          </button>
          <button
            className={`filter-btn ${showIncidents ? 'active' : ''}`}
            onClick={() => setShowIncidents(!showIncidents)}
          >
            <AlertCircle size={14} /> Incidents
          </button>
          <select defaultValue="All severity">
            <option>All severity</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className="map-live-state">
          <span className="pulse-dot" /> {mode === 'demo' ? 'SIMULATED AIS' : 'LIVE API'} · Updated{' '}
          {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="map-layout live-map-layout">
        <div className="map-canvas real-map-canvas">
          <div ref={mapRef} className="leaflet-map" style={{ width: '100%', height: '100%', minHeight: 520 }} />
          {!mapReady && (
            <div className="map-loading">
              <Activity size={18} /> Loading nautical map…
            </div>
          )}
          <div className="map-overlay-stats">
            <span>
              <Ship size={13} /> {vessels.length} tracked
            </span>
            <span>
              <Navigation size={13} /> {vessels.filter(v => v.status === 'Active').length} active
            </span>
            <span>
              <AlertCircle size={13} /> {initialIncidents.length} incidents
            </span>
          </div>
        </div>

        <aside className="map-detail vessel-detail-panel">
          <div className="detail-top">
            <span className="eyebrow">Selected vessel</span>
            <button className="more-btn" onClick={() => notify('Vessel actions menu opened')}>
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="vessel-detail-head">
            <div className="ship-avatar large">
              <Ship size={22} />
            </div>
            <div>
              <h2>{selectedVessel.name}</h2>
              <p>
                {selectedVessel.type} · MMSI {selectedVessel.mmsi}
              </p>
            </div>
            <span className="ais-badge">
              <i /> {selectedVessel.status}
            </span>
          </div>
          <div className="detail-stats vessel-detail-stats">
            <div>
              <span>Speed</span>
              <strong>{selectedVessel.speed.toFixed(1)} kn</strong>
            </div>
            <div>
              <span>Course</span>
              <strong>{Math.round(selectedVessel.course)}°</strong>
            </div>
            <div>
              <span>Risk</span>
              <strong>{selectedVessel.risk}/100</strong>
            </div>
          </div>
          <div className="detail-block">
            <span>Current position</span>
            <strong>
              {selectedVessel.lat.toFixed(4)}° N, {selectedVessel.lon.toFixed(4)}° E
            </strong>
          </div>
          <div className="detail-block">
            <span>Last AIS update</span>
            <strong>{selectedVessel.lastUpdate}</strong>
          </div>
          <div className="vessel-risk-bar">
            <div style={{ width: `${selectedVessel.risk}%` }} />
          </div>
          <p className="small-note">Source-risk score · proximity + vessel behavior + incident context</p>
          <div className="detail-actions">
            <button className="primary-btn" onClick={focusVessel}>
              <Crosshair size={15} /> Follow vessel
            </button>
            <button
              className="ghost-btn"
              onClick={() => notify(`${selectedVessel.name} trail contains ${selectedVessel.trail.length} recent points`)}
            >
              View trail
            </button>
          </div>

          <div className="nearby-incident" style={{ marginTop: 12 }}>
            <span className="eyebrow">Nearest incident</span>
            <strong>{selected.id}</strong>
            <span>
              {selected.location} · {selected.severity}
            </span>
            <div style={{ marginTop: 8 }}>
              <button
                className="emergency-action-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onOpenDispatch(selected)}
              >
                <Siren size={14} /> Alert Authorities for {selected.id}
              </button>
            </div>
          </div>
        </aside>
      </div>
      <div className="live-map-note" style={{ marginTop: 12 }}>
        <Zap size={14} />
        <span>
          <strong>Live mode ready:</strong> connected to <code>GET /api/vessels</code> & NASA GIBS Tile Layer. Demo mode continuously animates vessel drift vectors when the live stream is in background.
        </span>
      </div>
    </div>
  )
}

/* =========================================================================
   ANALYSIS WORKSPACE
   ========================================================================= */
function Analysis({
  notify,
  onOpenDispatch,
  autoAlertEnabled,
  onAutoDispatchAlert,
  onNavigate,
}: {
  notify: (s: string) => void
  onOpenDispatch: (i?: Incident) => void
  autoAlertEnabled: boolean
  onAutoDispatchAlert: (
    incident: Incident,
    agencies: string[],
    channel: string,
    priority: AlertPriority,
    notes: string,
    auto: boolean
  ) => void
  onNavigate: (v: View) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [autoAlertDispatched, setAutoAlertDispatched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const detectedIncident: Incident = {
    id: 'OS-2026-0147',
    location: 'Arabian Sea, Mumbai Offshore',
    area: '14.6 km²',
    confidence: 92,
    severity: 'High',
    time: 'Just now',
    status: 'Auto Alert Dispatched',
    x: 34,
    y: 42,
    coordinates: '19.0760° N, 72.8777° E',
    nearestVessel: 'MV Ocean Star',
    vesselDistance: '8.2 km',
  }

  const run = () => {
    setRunning(true)
    setAutoAlertDispatched(false)
    window.setTimeout(() => {
      setRunning(false)
      setAnalyzed(true)

      // When oil is detected in the ocean -> automatically dispatch alert to authorities if auto-alert is ON!
      if (autoAlertEnabled) {
        setAutoAlertDispatched(true)
        onAutoDispatchAlert(
          detectedIncident,
          ['ICG', 'DG_SHIPPING'],
          'API Webhook & Emergency Radio Broadcast',
          'Immediate',
          'Automated satellite SAR detection identified high-confidence hydrocarbon slick in Arabian Sea. Emergency response triggered.',
          true
        )
      } else {
        notify('Oil spill detected! Click "Alert Authorities" to dispatch.')
      }
    }, 3200)
  }

  return (
    <div className="page">
      <PageIntro
        eyebrow="Satellite AI Pipeline · Anomaly Detection"
        title="Analyze satellite imagery & Auto-Alert"
        description="Upload satellite scenes (SAR / Optical). High-confidence oil slicks automatically trigger emergency dispatches to Indian Coast Guard & DG Shipping."
        action={
          <div className="intro-actions">
            <span className="format-note"><ShieldCheck size={15} /> Auto-Alerting {autoAlertEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        }
      />

      <div className="analysis-grid">
        <section className="panel upload-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Scene input</p>
              <h2>Satellite image</h2>
            </div>
            <span className="step-count">01 / 02</span>
          </div>

          <button className={`dropzone ${file ? 'has-file' : ''}`} onClick={() => inputRef.current?.click()}>
            <input
              ref={inputRef}
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              hidden
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <div className="file-icon"><FileText size={22} /></div>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</span>
                <small>Click to replace scene</small>
              </>
            ) : (
              <>
                <div className="upload-icon"><Upload size={22} /></div>
                <strong>Drop a satellite scene here</strong>
                <span>or click to browse from your device</span>
                <small>TIFF, GeoTIFF, PNG, JPEG · max 50 MB</small>
              </>
            )}
          </button>

          <div className="form-grid">
            <label>Sensor type
              <select><option>SAR (Synthetic Aperture Radar)</option><option>Optical</option><option>Multispectral</option></select>
            </label>
            <label>Date captured
              <input type="date" defaultValue="2026-08-27" />
            </label>
            <label>Location / Sea Sector
              <input placeholder="e.g. Arabian Sea, India" defaultValue="Arabian Sea, Mumbai Offshore" />
            </label>
            <label>Analysis mode
              <select><option>Oil spill detection + Auto-Alert</option><option>Change detection</option><option>Water surface analysis</option></select>
            </label>
          </div>

          <button className="primary-btn run-btn" onClick={run} disabled={running}>
            {running ? (
              <><span className="spinner" /> Running AI Spill Segmentation & Correlating AIS...</>
            ) : (
              <><Play size={16} /> Run AI analysis & Check Ocean Spills</>
            )}
          </button>

          {running && (
            <div className="processing">
              <strong><span className="pulse-dot" /> AI pipeline active · Correlating with Coast Guard registry</strong>
              <div className="processing-line" />
            </div>
          )}
        </section>

        <section className="panel result-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Detection result</p>
              <h2>{running ? 'Scanning for ocean slicks...' : analyzed ? 'High-Severity Oil Spill Detected' : 'Potential spill detected'}</h2>
            </div>
            <span className="result-badge"><Sparkles size={14} /> AI assisted</span>
          </div>

          {running ? (
            <div className="loading-state">
              <Radar size={42} />
              <strong>Reading satellite scene</strong>
              <span>Segmenting dark anomaly contours and verifying ocean backscatter.</span>
              <div className="stage-list">
                <div className="done">✓ Validating radar polarization</div>
                <div className="done">✓ Preprocessing backscatter values</div>
                <div className="active-stage"><span className="spinner" /> Detecting oil slicks on water surface</div>
                <div>Simulating drift & preparing authority alert</div>
              </div>
            </div>
          ) : (
            <>
              {/* Emergency Auto-Alert Banner when oil is detected */}
              {autoAlertDispatched && (
                <div className="auto-dispatched-alert-box">
                  <div className="beacon-icon-wrap"><Siren size={18} className="emergency-icon-pulse" /></div>
                  <div className="auto-alert-text">
                    <strong>🚨 AUTOMATIC ALERT DISPATCHED TO AUTHORITIES</strong>
                    <p>
                      Emergency SITREP sent to <strong>Indian Coast Guard (ICG) MRCC</strong> & <strong>DG Shipping</strong>. Response transmission received!
                    </p>
                  </div>
                  <button className="ghost-btn sm" onClick={() => onNavigate('alerts')}>
                    View in Alert Center
                  </button>
                </div>
              )}

              <div className="result-summary">
                <div className="result-number">92<small>%</small><span>confidence</span></div>
                <div className="result-copy">
                  <Status severity="High">High severity</Status>
                  <p>Dark anomaly pattern is consistent with a potential hydrocarbon slick in the Arabian Sea.</p>
                </div>
              </div>

              <div className="comparison">
                <div className="sat-image original">
                  <span>Original satellite scene</span>
                  <div className="coastline" />
                </div>
                <div className="sat-image overlay">
                  <span>AI segmentation overlay</span>
                  <div className="slick" />
                  <div className="coastline" />
                </div>
              </div>

              <div className="result-facts">
                <div><span>Estimated spill area</span><strong>14.6 km²</strong></div>
                <div><span>Nearest suspected vessel</span><strong>MV Ocean Star <small>8.2 km away</small></strong></div>
              </div>

              <div className="detail-actions">
                <button className="emergency-action-btn" onClick={() => onOpenDispatch(detectedIncident)}>
                  <Siren size={15} /> Dispatch to More Authorities
                </button>
                <button className="primary-btn" onClick={() => notify('Incident OS-2026-0147 saved to database')}>
                  Save incident
                </button>
                <button className="ghost-btn" onClick={() => notify('Opening incident on map')}>
                  View on map
                </button>
                <button className="icon-btn bordered" onClick={() => notify('Analysis package exported')} title="Download SITREP">
                  <Download size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

/* =========================================================================
   INCIDENT DETAIL VIEW
   ========================================================================= */
function IncidentDetail({
  incident,
  notify,
  onOpenDispatch,
  alerts,
  messages,
}: {
  incident: Incident
  notify: (s: string) => void
  onOpenDispatch: (i: Incident) => void
  alerts: AuthorityAlert[]
  messages: AuthorityMessage[]
}) {
  const [status, setStatus] = useState('Under Investigation')
  const matchingAlerts = alerts.filter(a => a.incidentId === incident.id)
  const matchingMessages = messages.filter(m => m.incidentId === incident.id)

  return (
    <div className="page">
      <PageIntro
        eyebrow="Incident detail · AI-assisted review & Dispatch"
        title={incident.id}
        description={`${incident.location} · Detection received ${incident.time}`}
        action={
          <div className="intro-actions">
            <button className="emergency-action-btn" onClick={() => onOpenDispatch(incident)}>
              <Siren size={16} /> Dispatch Authority Alert
            </button>
            <Status severity={incident.severity}>{status}</Status>
          </div>
        }
      />

      <div className="detail-page-grid">
        <section className="panel detail-media">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Scene intelligence</p>
              <h2>Segmentation & Spill Characterization</h2>
            </div>
            <span className="result-badge"><ShieldCheck size={14} /> Analyst review pending</span>
          </div>

          <div className="detail-scene">
            <div className="sat-image original">
              <span>Satellite scene · SAR</span>
              <div className="coastline" />
            </div>
            <div className="sat-image overlay">
              <span>Spill segmentation</span>
              <div className="slick" />
              <div className="coastline" />
            </div>
          </div>

          <div className="scene-caption">
            <span>Scene captured · 27 Aug 2026, 14:14 UTC</span>
            <span>Model · OS-AI v2.4.1</span>
          </div>

          <div className="detail-timeline">
            <TimelineItem done title="Satellite scene received" time="14:14 UTC" />
            <TimelineItem done title="AI detection completed" time="14:17 UTC" />
            <TimelineItem done title="Authority Alert Dispatched" time="14:18 UTC" />
            <TimelineItem title="Response Team Action" time="Active" />
          </div>

          {/* Dispatched Authorities Panel */}
          <div className="authorities-detail-section">
            <div className="section-subhead">
              <h3><Siren size={16} /> Dispatched Authorities & Response Units ({matchingAlerts.length})</h3>
              <button className="text-btn" onClick={() => onOpenDispatch(incident)}>+ Dispatch Additional Agency</button>
            </div>

            {matchingAlerts.length > 0 ? (
              <div className="detail-alert-list">
                {matchingAlerts.map(a => (
                  <div className="detail-alert-row" key={a.id}>
                    <div className="alert-row-main">
                      <strong>{a.agency}</strong>
                      <span>Channel: {a.channel} · Dispatched {a.dispatchedAt}</span>
                      {a.responseTeam && <small className="response-team-text">Unit: {a.responseTeam}</small>}
                    </div>
                    <span className={`status-pill ${a.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      <i />{a.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-alerts-yet">
                <p>No authorities alerted yet for this incident.</p>
                <button className="primary-btn sm" onClick={() => onOpenDispatch(incident)}>
                  <Send size={13} /> Dispatch to Coast Guard
                </button>
              </div>
            )}

            {/* Authority Incoming Transmissions Section */}
            {matchingMessages.length > 0 && (
              <div className="incident-messages-box">
                <h4><Radio size={14} /> Incoming Authority Responses ({matchingMessages.length}):</h4>
                {matchingMessages.map(m => (
                  <div className="msg-bubble-inline" key={m.id}>
                    <div className="msg-bubble-top">
                      <strong>{m.agency}</strong>
                      <span>{m.timestamp}</span>
                    </div>
                    <p>{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="panel incident-sidebar">
          <div className="detail-stats">
            <div><span>Confidence</span><strong>{incident.confidence}%</strong></div>
            <div><span>Est. area</span><strong>{incident.area}</strong></div>
            <div><span>Risk level</span><strong className="risk-text">{incident.severity}</strong></div>
          </div>

          <div className="detail-block">
            <span>Coordinates</span>
            <strong>{incident.coordinates || '19.0760° N, 72.8777° E'}</strong>
          </div>

          <div className="detail-block">
            <span>Weather conditions</span>
            <strong><CloudSun size={14} /> 27°C · Wind 12 kn SW</strong>
          </div>

          <div className="detail-block">
            <span>Nearest vessel</span>
            <strong><Ship size={14} /> {incident.nearestVessel || 'MV Ocean Star'} <em>{incident.vesselDistance || '8.2 km'} away</em></strong>
          </div>

          <p className="eyebrow notes-label">Analyst notes</p>
          <textarea placeholder="Add an observation or handoff note for Coast Guard..." />

          <p className="eyebrow status-label">Update status</p>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option>New</option>
            <option>Under Investigation</option>
            <option>Confirmed</option>
            <option>False Positive</option>
            <option>Resolved</option>
          </select>
          <button className="primary-btn save-status" onClick={() => notify(`Status updated to ${status}`)}>
            Save incident update
          </button>
        </aside>
      </div>

      <section className="panel source-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Probable source assessment</p>
            <h2>Nearby vessels & AIS Signals</h2>
          </div>
          <button className="text-btn" onClick={() => notify('Vessel intelligence opened')}>
            View vessel intelligence <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="source-grid">
          <span>Vessel</span>
          <span>Distance</span>
          <span>Speed / direction</span>
          <span>AIS signal</span>
          <span>Risk score</span>
          <strong>MV Ocean Star</strong>
          <span>8.2 km</span>
          <span>11.4 kn · SW</span>
          <span className="ais"><i />Active</span>
          <b className="risk-score high">82</b>
        </div>
      </section>
    </div>
  )
}

function TimelineItem({ done, title, time }: { done?: boolean; title: string; time: string }) {
  return (
    <div className={`timeline-item ${done ? 'done' : ''}`}>
      <i>{done ? '✓' : ''}</i>
      <div><strong>{title}</strong><span>{time}</span></div>
    </div>
  )
}

/* =========================================================================
   INCIDENTS LIST VIEW
   ========================================================================= */
function Incidents({
  incidents,
  onSelect,
  onOpenDispatch,
}: {
  incidents: Incident[]
  onSelect: (i: Incident) => void
  onOpenDispatch: (i: Incident) => void
}) {
  return (
    <div className="page">
      <PageIntro
        eyebrow={`Incident register · ${incidents.length} total`}
        title="All ocean incidents"
        description="Review, triage, and dispatch emergency alerts to maritime authorities."
        action={
          <div className="intro-actions">
            <button className="emergency-action-btn" onClick={() => onOpenDispatch(incidents[0])}>
              <Siren size={15} /> Emergency Dispatch
            </button>
            <button className="ghost-btn"><Filter size={15} /> Filter view</button>
          </div>
        }
      />
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search compact"><Search size={15} /><input placeholder="Search by ID or region" /></div>
          <span>Showing {incidents.length} incidents</span>
        </div>
        <div className="incident-table">
          <div className="table-head">
            <span>Incident</span>
            <span>Severity</span>
            <span>Confidence</span>
            <span>Area</span>
            <span>Detected</span>
            <span>Status</span>
          </div>
          {incidents.map(i => (
            <button className="table-row" key={i.id} onClick={() => onSelect(i)}>
              <div className="id-cell">
                <div className={`severity-mark ${i.severity.toLowerCase()}`} />
                <strong>{i.id}</strong>
                <small>{i.location}</small>
              </div>
              <Status severity={i.severity}>{i.severity}</Status>
              <strong>{i.confidence}%</strong>
              <span>{i.area}</span>
              <span>{i.time}</span>
              <span className="row-status">{i.status}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   VESSELS & AIS VIEW
   ========================================================================= */
function Vessels({ notify }: { notify: (s: string) => void }) {
  return (
    <div className="page">
      <PageIntro
        eyebrow="AIS correlation · Simulated data"
        title="Vessel intelligence"
        description="Understand nearby vessel activity around detected anomalies and prioritize source assessment."
        action={<button className="primary-btn" onClick={() => notify('Vessel data refreshed')}><Activity size={16} /> Refresh AIS</button>}
      />
      <div className="vessel-summary">
        <Metric icon={<Ship />} label="Tracked vessels" value="1,284" delta="+2.8%" detail="Across 12 corridors" tone="blue" />
        <Metric icon={<Crosshair />} label="Near active alerts" value="32" delta="6 flagged" detail="Within 25 km" tone="amber" />
        <Metric icon={<Gauge />} label="AIS coverage" value="98.2" suffix="%" delta="Nominal" detail="Last 24 hours" tone="cyan" />
      </div>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Probable source assessment</p>
            <h2>Vessels near active alerts</h2>
          </div>
          <button className="more-btn"><MoreHorizontal size={18} /></button>
        </div>
        <div className="vessel-list">
          {['MV Ocean Star', 'MT Meridian', 'Seabird Explorer', 'Pacific Trader'].map((name, i) => (
            <div className="vessel-row" key={name}>
              <div className="ship-avatar"><Ship size={18} /></div>
              <div className="vessel-name">
                <strong>{name}</strong>
                <span>{['Tanker · IMO 9123456', 'Cargo · IMO 9234521', 'Research · IMO 9856321', 'Tanker · IMO 9076512'][i]}</span>
              </div>
              <div><small>Distance</small><strong>{['8.2 km', '12.7 km', '18.4 km', '24.1 km'][i]}</strong></div>
              <div><small>Speed</small><strong>{['11.4 kn', '9.8 kn', '4.2 kn', '13.1 kn'][i]}</strong></div>
              <div><small>AIS signal</small><strong className="ais"><i />Active</strong></div>
              <div className={`risk-score ${i === 0 ? 'high' : i === 1 ? 'medium' : ''}`}>{[82, 61, 28, 19][i]}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   REPORTS VIEW
   ========================================================================= */
function Reports({ notify }: { notify: (s: string) => void }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className="page">
      <PageIntro
        eyebrow="Document center · 24 reports"
        title="Analysis & Authority SITREP reports"
        description="Download and share verified intelligence packages with maritime and environmental response teams."
        action={<button className="primary-btn" onClick={() => setShowModal(true)}><FileText size={16} /> Generate report</button>}
      />
      <div className="filter-row report-filters">
        <div className="search compact"><Search size={15} /><input placeholder="Search reports" /></div>
        <select><option>All severity</option></select>
        <select><option>All regions</option></select>
        <button className="ghost-btn"><Download size={15} /> Export list</button>
      </div>
      <section className="panel table-panel reports-panel">
        <div className="report-list">
          {initialIncidents.map(i => (
            <div className="report-row" key={i.id}>
              <div className="report-icon"><FileText size={20} /></div>
              <div className="report-main">
                <strong>Spill & Coast Guard SITREP · {i.id}</strong>
                <span>{i.location} · Generated {i.time}</span>
              </div>
              <Status severity={i.severity}>{i.severity}</Status>
              <div><small>Area</small><strong>{i.area}</strong></div>
              <div><small>Confidence</small><strong>{i.confidence}%</strong></div>
              <button className="icon-btn bordered" onClick={() => notify(`Downloading ${i.id} report`)}><Download size={16} /></button>
            </div>
          ))}
        </div>
      </section>
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <div><p className="eyebrow">Report preview</p><h2>New spill intelligence brief</h2></div>
              <button className="more-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="preview-page">
              <strong>OCEAN SENTINEL AI</strong>
              <h3>Marine incident & Authority SITREP</h3>
              <p>OS-2026-0147 · Arabian Sea</p>
              <div className="preview-rule" />
              <div><span>Summary</span><strong>Potential high-severity oil spill detected</strong></div>
              <div><span>Authority Alert Status</span><strong>Dispatched to Indian Coast Guard & DG Shipping</strong></div>
              <div><span>Confidence / affected area</span><strong>92% · 14.6 km²</strong></div>
              <div><span>Data sources</span><strong>SAR imagery · AIS correlation · weather model</strong></div>
            </div>
            <button className="primary-btn modal-download" onClick={() => { setShowModal(false); notify('Report generated and download started') }}>
              <Download size={15} /> Generate & download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   SETTINGS VIEW
   ========================================================================= */
function SettingsView({
  notify,
  autoAlertEnabled,
  onToggleAutoAlert,
}: {
  notify: (s: string) => void
  autoAlertEnabled: boolean
  onToggleAutoAlert: () => void
}) {
  return (
    <div className="page">
      <PageIntro eyebrow="Workspace configuration" title="Settings & Alert Preferences" description="Configure automatic authority alerting rules, recipient maritime agencies, and API integrations." />
      <section className="settings-grid">
        <div className="panel settings-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Authority Alert Automation</p>
              <h2>Emergency Dispatch Rules</h2>
            </div>
          </div>

          <label className="toggle-row">
            <span>
              <strong>Auto-dispatch alert to Coast Guard when oil detected</strong>
              <small>Automatically transmits high-confidence (&gt;80%) spill telemetry to Indian Coast Guard MRCC</small>
            </span>
            <input type="checkbox" checked={autoAlertEnabled} onChange={onToggleAutoAlert} />
            <i />
          </label>

          <label className="toggle-row">
            <span>
              <strong>Broadcast NAVTEX emergency warning to nearby vessels</strong>
              <small>Notifies all commercial vessels within 25 km radius on VHF Ch 16 / NAVTEX 518 kHz</small>
            </span>
            <input type="checkbox" defaultChecked />
            <i />
          </label>

          <label className="toggle-row">
            <span>
              <strong>Include AIS Vessel Proximity & Drift Vector in Dispatch</strong>
              <small>Attaches suspected polluter vessel IMO number and hydrodynamic forecast</small>
            </span>
            <input type="checkbox" defaultChecked />
            <i />
          </label>

          <button className="primary-btn" onClick={() => notify('Authority alerting settings saved')}>
            Save Alert Preferences
          </button>
        </div>

        <div className="panel settings-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Maritime Integrations</p>
              <h2>Authorities API Endpoints</h2>
            </div>
          </div>
          <div className="setting-stat">
            <span>Coast Guard MRCC Helpline</span>
            <strong>1554 / +91-22-24371932</strong>
          </div>
          <div className="setting-stat">
            <span>INCOIS API Webhook</span>
            <strong>https://incois.gov.in/api/v2/spill</strong>
          </div>
          <div className="setting-stat">
            <span>DG Shipping Env Portal</span>
            <strong>https://dgshipping.gov.in/env-cell</strong>
          </div>
          <div className="setting-stat">
            <span>Default Monitored Sea Zone</span>
            <select><option>Indian Ocean & Arabian Sea</option><option>Bay of Bengal</option></select>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App

