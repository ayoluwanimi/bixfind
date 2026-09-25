let inMemoryTickets: SupportTicket[] = []
let fsAvailable: boolean | null = null

export interface SupportTicket {
  id: string
  subject: string
  message: string
  userName: string
  userEmail: string
  userPhone?: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  category?: string
  replies: SupportReply[]
}

export interface SupportReply {
  id: string
  body: string
  authorEmail: string
  authorName: string
  isAdmin: boolean
  createdAt: string
}

async function loadFs(): Promise<{ fs: typeof import('fs'); path: typeof import('path') } | null> {
  if (fsAvailable === false) return null
  try {
    const fs = await import('fs')
    const path = await import('path')
    const DATA_DIR = path.join(process.cwd(), '.support-data')
    const DATA_FILE = path.join(DATA_DIR, 'tickets.json')
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fsAvailable = true
    return { fs, path }
  } catch {
    fsAvailable = false
    return null
  }
}

function readAllSync(): SupportTicket[] {
  try {
    const fs = require('fs')
    const path = require('path')
    const DATA_DIR = path.join(process.cwd(), '.support-data')
    const DATA_FILE = path.join(DATA_DIR, 'tickets.json')
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(DATA_FILE)) return []
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as SupportTicket[]
  } catch {
    return inMemoryTickets
  }
}

function writeAllSync(tickets: SupportTicket[]) {
  try {
    const fs = require('fs')
    const path = require('path')
    const DATA_DIR = path.join(process.cwd(), '.support-data')
    const DATA_FILE = path.join(DATA_DIR, 'tickets.json')
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2), 'utf-8')
  } catch {
    inMemoryTickets = tickets
  }
}

export function getAllTickets(): SupportTicket[] {
  return readAllSync().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getTicketById(id: string): SupportTicket | undefined {
  return readAllSync().find(t => t.id === id)
}

export function createTicket(input: Omit<SupportTicket, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'replies'>): SupportTicket {
  const tickets = readAllSync()
  const ticket: SupportTicket = {
    ...input,
    id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'open',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [],
  }
  tickets.push(ticket)
  writeAllSync(tickets)
  return ticket
}

export function updateTicket(id: string, updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'updatedAt'>>): SupportTicket | null {
  const tickets = readAllSync()
  const idx = tickets.findIndex(t => t.id === id)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], ...updates, updatedAt: new Date().toISOString() }
  writeAllSync(tickets)
  return tickets[idx]
}

export function addReply(ticketId: string, reply: Omit<SupportReply, 'id' | 'createdAt'>): SupportTicket | null {
  const tickets = readAllSync()
  const idx = tickets.findIndex(t => t.id === ticketId)
  if (idx === -1) return null
  const newReply: SupportReply = {
    ...reply,
    id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  tickets[idx].replies.push(newReply)
  tickets[idx].status = 'in-progress'
  tickets[idx].updatedAt = new Date().toISOString()
  writeAllSync(tickets)
  return tickets[idx]
}
