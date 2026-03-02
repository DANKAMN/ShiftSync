"use server"

import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type WeeklyEntry = { weekday: number; start: string; end: string }

export async function setWeeklyAvailability(entries: WeeklyEntry[]) {
  await connectDB()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated" }
  }

  const userId = session.user.id
  const user = await User.findById(userId)
  if (!user) return { ok: false, error: "User not found" }

  user.weeklyAvailability = entries
  await user.save()

  return { ok: true }
}