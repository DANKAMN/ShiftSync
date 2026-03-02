import Availability from "@/models/Availability"
import User from "@/models/User"
import { format } from "date-fns"

/**
 * checkAvailability(userId, shiftStart, shiftEnd)
 * - returns { ok:true } or { ok:false, error: string }
 *
 * Behavior:
 * 1) Look up EXCEPTION in Availability collection (type=EXCEPTION)
 * 2) Look up WEEKLY in Availability collection (type=WEEKLY)
 * 3) If no Availability docs, FALLBACK to User.weeklyAvailability (legacy)
 *
 * NOTE: shiftStart/shiftEnd are expected to be Date objects (UTC).
 */
export async function checkAvailability(
  userId: string,
  shiftStart: Date,
  shiftEnd: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  // build date range for the day
  const dateKey = format(shiftStart, "yyyy-MM-dd")
  const dayStart = new Date(`${dateKey}T00:00:00.000Z`)
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`)

  // 1) EXCEPTION docs (most specific)
  const exception = await Availability.findOne({
    user: userId,
    type: "EXCEPTION",
    date: { $gte: dayStart, $lte: dayEnd },
  }).lean()

  if (exception) {
    if (!exception.isAvailable) {
      return { ok: false, error: "Staff marked unavailable for this date (exception)." }
    }
    return { ok: true }
  }

  // weekday number 0..6
  const dow = shiftStart.getDay()
  // 2) WEEKLY docs in Availability collection
  const weeklyDoc = await Availability.findOne({
    user: userId,
    type: "WEEKLY",
    dayOfWeek: dow,
  }).lean()

  const shiftStartHM = format(shiftStart, "HH:mm")
  const shiftEndHM = format(shiftEnd, "HH:mm")

  if (weeklyDoc) {
    if (!weeklyDoc.startTime || !weeklyDoc.endTime) {
      return { ok: false, error: "Staff weekly availability is not properly configured." }
    }
    if (shiftStartHM < weeklyDoc.startTime || shiftEndHM > weeklyDoc.endTime) {
      return { ok: false, error: "Shift falls outside staff's availability window (weekly availability)." }
    }
    return { ok: true }
  }

  // 3) FALLBACK: try User.weeklyAvailability (legacy)
  const user = await User.findById(userId).lean()
  if (!user) return { ok: false, error: "User not found." }

  const weeklyArray = (user.weeklyAvailability || []) as Array<{
    weekday: number
    start?: string
    end?: string
  }>

  const weekly = weeklyArray.find((w) => w.weekday === dow)
  if (!weekly) {
    return { ok: false, error: "No weekly availability set for this weekday." }
  }

  if (!weekly.start || !weekly.end) {
    return { ok: false, error: "Staff weekly availability is not properly configured (user)."}
  }

  if (shiftStartHM < weekly.start || shiftEndHM > weekly.end) {
    return { ok: false, error: "Shift falls outside staff's availability window (user)." }
  }

  return { ok: true }
}