"use server"

import { connectDB } from "@/lib/mongodb"
import Availability from "@/models/Availability"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function createAvailabilityException(payload: { date: Date; isAvailable: boolean; note?: string }) {
  await connectDB()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" }

  const userId = session.user.id
  const { date, isAvailable, note } = payload

  // normalize date to midnight (store as date only)
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)

  const ex = await Availability.create({
    user: userId,
    type: "EXCEPTION",
    date: d,
    isAvailable,
    note: note || null,
  })

  return { ok: true, exception: ex._id.toString() }
}