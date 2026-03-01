import { prisma } from "@/lib/prisma"
import { addHours, differenceInHours, startOfWeek, endOfWeek } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"


/**
 * STANDARD ENGINE RESPONSE SHAPE
 */
export type EngineResult =
  | { ok: true; warnings?: string[] }
  | { ok: false; error: string; suggestions?: unknown[] }

/* =========================================================
   1. CONFLICT CHECKER
   - Prevent overlapping shifts
   - Enforce 10-hour rest rule
========================================================= */
export async function checkConflicts(
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeShiftId?: string
): Promise<EngineResult> {
  // Get all assigned shifts for this user
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId: staffId,
      status: { not: "CANCELLED" },
      shift: excludeShiftId
        ? { NOT: { id: excludeShiftId } }
        : undefined,
    },
    include: { shift: true },
  })

  for (const a of assignments) {
    const existingStart = a.shift.start
    const existingEnd = a.shift.end

    // 1. Overlap check
    const overlaps =
      startTime < existingEnd && endTime > existingStart

    if (overlaps) {
      return {
        ok: false,
        error: "Double booking detected. Staff already assigned to overlapping shift.",
      }
    }

    // 2. 10-hour rest rule
    const hoursAfterPrevious = differenceInHours(startTime, existingEnd)
    const hoursBeforeNext = differenceInHours(existingStart, endTime)

    if (hoursAfterPrevious > 0 && hoursAfterPrevious < 10) {
      return {
        ok: false,
        error: `10-hour rest rule violated. Only ${hoursAfterPrevious}h between shifts.`,
      }
    }

    if (hoursBeforeNext > 0 && hoursBeforeNext < 10) {
      return {
        ok: false,
        error: `10-hour rest rule violated. Only ${hoursBeforeNext}h between shifts.`,
      }
    }
  }

  return { ok: true }
}

/* =========================================================
   2. SKILL VALIDATION
   - Ensure staff has required skill
========================================================= */
export async function validateSkill(
  staffId: string,
  shiftId: string
): Promise<EngineResult> {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  })

  if (!shift?.requiredSkillId) {
    return { ok: true }
  }

  const skill = await prisma.userSkill.findFirst({
    where: {
      userId: staffId,
      skillId: shift.requiredSkillId,
    },
  })

  if (!skill) {
    return {
      ok: false,
      error: "Staff does not possess required skill for this shift.",
    }
  }

  return { ok: true }
}

/* =========================================================
   3. OVERTIME CALCULATOR
   - Weekly hours
   - Daily hard/soft caps
   - 6th/7th day consecutive rule
========================================================= */
export async function calculateOvertime(
  staffId: string,
  referenceDate: Date
) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      userId: staffId,
      status: { not: "CANCELLED" },
      shift: {
        start: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    },
    include: { shift: true },
  })

  let totalHours = 0
  const dailyMap: Record<string, number> = {}

  for (const a of assignments) {
    const hours =
      (a.shift.end.getTime() - a.shift.start.getTime()) /
      (1000 * 60 * 60)

    totalHours += hours

    const dayKey = a.shift.start.toISOString().split("T")[0]
    dailyMap[dayKey] = (dailyMap[dayKey] || 0) + hours
  }

  const warnings: string[] = []
  let hardBlock = false

  if (totalHours >= 35) {
    warnings.push("Approaching 40h weekly overtime threshold.")
  }

  if (totalHours > 40) {
    warnings.push("Exceeded 40h weekly overtime.")
  }

  for (const day in dailyMap) {
    if (dailyMap[day] > 8) {
      warnings.push(`Exceeded 8h on ${day}.`)
    }
    if (dailyMap[day] > 12) {
      hardBlock = true
      warnings.push(`Exceeded 12h hard limit on ${day}.`)
    }
  }

  // Consecutive day rule
  const sortedDays = Object.keys(dailyMap).sort()
  let consecutive = 1

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1])
    const curr = new Date(sortedDays[i])
    const diff =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

    if (diff === 1) {
      consecutive++
    } else {
      consecutive = 1
    }

    if (consecutive === 6) {
      warnings.push("6th consecutive day worked.")
    }

    if (consecutive === 7) {
      warnings.push("7th consecutive day requires manager override.")
      hardBlock = true
    }
  }

  return {
    totalHours,
    warnings,
    hardBlock,
  }
}

/* =========================================================
   4. TIMEZONE HANDLER
   - Store UTC
   - Display in location timezone
========================================================= */
export function handleTimezones(
  date: Date,
  locationTimezone: string,
  direction: "toDisplay" | "toUTC"
) {
  if (direction === "toDisplay") {
    return toZonedTime(date, locationTimezone)
  }
  return fromZonedTime(date, locationTimezone)
}