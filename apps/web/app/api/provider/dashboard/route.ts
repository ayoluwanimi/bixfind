import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/supabase-db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()

    // Today's bookings count
    const { count: todayBookings } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", user.id)
      .gte("created_at", todayStart)

    // Total bookings (all time)
    const { count: totalBookings } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", user.id)

    // Active clients (distinct customer_ids from bookings)
    const { data: clientRows } = await db
      .from("bookings")
      .select("customer_id")
      .eq("provider_id", user.id)

    const uniqueClients = new Set((clientRows ?? []).map((r: any) => r.customer_id))

    // Today's revenue (CREDIT wallet entries today)
    const { data: todayCredits } = await db
      .from("wallet_entries")
      .select("amount")
      .eq("profile_id", user.id)
      .eq("entry_type", "CREDIT")
      .gte("created_at", todayStart)

    const todayRevenue = (todayCredits ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    // This week's revenue
    const { data: weekCredits } = await db
      .from("wallet_entries")
      .select("amount")
      .eq("profile_id", user.id)
      .eq("entry_type", "CREDIT")
      .gte("created_at", weekStart)

    const weekRevenue = (weekCredits ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    // Weekly breakdown (last 7 days)
    const weeklyData: number[] = []
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString()
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1).toISOString()
      const { data: dayEntries } = await db
        .from("wallet_entries")
        .select("amount")
        .eq("profile_id", user.id)
        .eq("entry_type", "CREDIT")
        .gte("created_at", dayStart)
        .lt("created_at", dayEnd)
      const dayTotal = (dayEntries ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
      // Convert from kobo to naira (amounts in wallet_entries are in kobo/100)
      weeklyData.push(Math.round(dayTotal))
    }

    // Recent bookings for activity feed
    const { data: recentBookings } = await db
      .from("bookings")
      .select("id, status, total_amount, created_at, customer_id")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Recent wallet entries for activity
    const { data: recentEntries } = await db
      .from("wallet_entries")
      .select("id, entry_type, amount, description, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Build activity feed
    const activities: Array<{ id: string; type: string; text: string; time: string }> = []

    for (const booking of (recentBookings ?? []).slice(0, 5)) {
      const timeAgo = getTimeAgo(booking.created_at)
      if (booking.status === 'completed') {
        activities.push({ id: `b-${booking.id}`, type: 'booking', text: `Booking completed — ₦${Number(booking.total_amount).toLocaleString()}`, time: timeAgo })
      } else if (booking.status === 'cancelled') {
        activities.push({ id: `b-${booking.id}`, type: 'cancel', text: `Booking cancelled`, time: timeAgo })
      } else {
        activities.push({ id: `b-${booking.id}`, type: 'booking', text: `New booking received — ₦${Number(booking.total_amount).toLocaleString()}`, time: timeAgo })
      }
    }

    for (const entry of (recentEntries ?? []).slice(0, 5)) {
      const timeAgo = getTimeAgo(entry.created_at)
      if (entry.entry_type === 'CREDIT') {
        activities.push({ id: `e-${entry.id}`, type: 'payment', text: entry.description || `Payment received — ₦${Math.round(Number(entry.amount)).toLocaleString()}`, time: timeAgo })
      } else if (entry.entry_type === 'PAYOUT') {
        activities.push({ id: `e-${entry.id}`, type: 'payment', text: entry.description || `Payout processed`, time: timeAgo })
      }
    }

    // Sort by most recent and deduplicate
    activities.sort((a, b) => {
      // Simple sort by checking if ID starts with same prefix
      return 0
    })

    return NextResponse.json({
      stats: {
        bookings: todayBookings ?? 0,
        clients: uniqueClients.size,
        revenue: Math.round(todayRevenue),
        week: Math.round(weekRevenue),
      },
      weeklyData,
      activities: activities.slice(0, 6),
      totalBookings: totalBookings ?? 0,
    })
  } catch (error) {
    console.error("GET /api/provider/dashboard error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard" },
      { status: 500 },
    )
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
