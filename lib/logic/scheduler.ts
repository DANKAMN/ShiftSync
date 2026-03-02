// lib/logic/scheduler.ts
import Shift from "@/models/Shift"
import { differenceInHours, startOfWeek, endOfWeek } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

/**
 * EngineResult standard
 */
export type EngineResult =
  | { ok: true; warnings?: string[] }
  | { ok: false; error: string }

/* -------------------------
   1) conflicts (no double-booking, 10h rest)
   ------------------------- */
export async function checkConflicts(
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeShiftId?: string
): Promise<EngineResult> {
  const shifts = await Shift.find({
    "assignments.user": staffId,
    _id: excludeShiftId ? { $ne: excludeShiftId } : { $exists: true },
  }).lean()

  for (const s of shifts) {
    const existingStart = s.start
    const existingEnd = s.end

    const overlaps = startTime < existingEnd && endTime > existingStart
    if (overlaps) {
      return { ok: false, error: "Double booking detected with another assigned shift." }
    }

    const hoursAfterPrev = differenceInHours(startTime, existingEnd)
    const hoursBeforeNext = differenceInHours(existingStart, endTime)

    if (hoursAfterPrev > 0 && hoursAfterPrev < 10) {
      return { ok: false, error: `10-hour rest rule violated: only ${hoursAfterPrev} hours between shifts.` }
    }
    if (hoursBeforeNext > 0 && hoursBeforeNext < 10) {
      return { ok: false, error: `10-hour rest rule violated: only ${hoursBeforeNext} hours between shifts.` }
    }
  }

  return { ok: true }
}

/* -------------------------
   2) calculate weekly/daily hours (existing assignments)
   ------------------------- */
export async function calculateOvertime(staffId: string, referenceDate: Date) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

  const shifts = await Shift.find({
    "assignments.user": staffId,
    start: { $gte: weekStart, $lte: weekEnd },
  }).lean()

  let totalHours = 0
  const dailyMap: Record<string, number> = {}

  for (const s of shifts) {
    const hours = (new Date(s.end).getTime() - new Date(s.start).getTime()) / (1000 * 60 * 60)
    totalHours += hours
    const key = new Date(s.start).toISOString().split("T")[0]
    dailyMap[key] = (dailyMap[key] || 0) + hours
  }

  const warnings: string[] = []
  let hardBlock = false

  if (totalHours >= 35) warnings.push("Approaching weekly 40h limit.")
  if (totalHours > 40) warnings.push("Exceeded weekly 40h.")

  for (const d in dailyMap) {
    if (dailyMap[d] > 8) warnings.push(`Exceeded 8h on ${d}`)
    if (dailyMap[d] > 12) {
      hardBlock = true
      warnings.push(`Exceeded 12h on ${d}`)
    }
  }

  // consecutive day calc
  const days = Object.keys(dailyMap).sort()
  let consecutive = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) consecutive++ // consecutive
    else consecutive = 1

    if (consecutive === 6) warnings.push("6th consecutive day worked.")
    if (consecutive === 7) {
      warnings.push("7th consecutive day: manager override required.")
      hardBlock = true
    }
  }

  return { totalHours, warnings, hardBlock, dailyMap }
}

/* -------------------------
   3) what-if: include a candidate shift into weekly/daily calc
   ------------------------- */
export async function projectIfAssigned(staffId: string, candidateStart: Date, candidateEnd: Date) {
  const base = await calculateOvertime(staffId, candidateStart)
  const candidateHours = (candidateEnd.getTime() - candidateStart.getTime()) / (1000 * 60 * 60)

  const projectedTotal = base.totalHours + candidateHours

  // compute projected daily total for the day of candidate
  const dateKey = candidateStart.toISOString().split("T")[0]
  const projectedDaily = (base.dailyMap[dateKey] || 0) + candidateHours

  const warnings = [...base.warnings]
  let hardBlock = base.hardBlock

  if (projectedTotal >= 35 && !warnings.includes("Approaching weekly 40h limit.")) {
    warnings.push("Approaching weekly 40h limit (with this shift).")
  }
  if (projectedTotal > 40) warnings.push("Will exceed weekly 40h (with this shift).")

  if (projectedDaily > 8 && !warnings.some((w) => w.includes("Exceeded 8h"))) warnings.push(`Will exceed 8h on ${dateKey}`)
  if (projectedDaily > 12) {
    hardBlock = true
    warnings.push(`Will exceed 12h hard limit on ${dateKey}`)
  }

  return { projectedTotal, projectedDaily, warnings, hardBlock }
}

/* -------------------------
   4) timezone helpers (kept)
   ------------------------- */
export function handleTimezones(date: Date, locationTimezone: string, direction: "toDisplay" | "toUTC") {
  if (direction === "toDisplay") return toZonedTime(date, locationTimezone)
  return fromZonedTime(date, locationTimezone)
}