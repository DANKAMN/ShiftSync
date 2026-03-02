// lib/logic/availability.ts
import Availability from "@/models/Availability"
import { format } from "date-fns"

/**
 * checkAvailability(userId, shiftStart, shiftEnd)
 * - returns { ok:true } or { ok:false, error }
 */
export async function checkAvailability(
  userId: string,
  shiftStart: Date,
  shiftEnd: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  // check EXCEPTION for that date first
  const dateKey = format(shiftStart, "yyyy-MM-dd")
  const dayStart = new Date(`${dateKey}T00:00:00.000Z`)
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`)

  const exception = await Availability.findOne({
    user: userId,
    type: "EXCEPTION",
    date: { $gte: dayStart, $lte: dayEnd },
  }).lean()

  if (exception) {
    if (!exception.isAvailable) {
      return { ok: false, error: "Staff marked unavailable for this date (exception)." }
    }
    // if exception exists and isAvailable=true -> allow
    return { ok: true }
  }

  // Weekly availability
  const dow = shiftStart.getDay() // 0..6
  const weekly = await Availability.findOne({
    user: userId,
    type: "WEEKLY",
    dayOfWeek: dow,
  }).lean()

  if (!weekly) {
    return { ok: false, error: "No weekly availability set for this weekday." }
  }

  const shiftStartHM = format(shiftStart, "HH:mm")
  const shiftEndHM = format(shiftEnd, "HH:mm")

  if (!weekly.startTime || !weekly.endTime) {
    return { ok: false, error: "Staff weekly availability is not properly configured." }
  }

  if (shiftStartHM < weekly.startTime || shiftEndHM > weekly.endTime) {
    return { ok: false, error: "Shift falls outside staff's availability window." }
  }

  return { ok: true }
}