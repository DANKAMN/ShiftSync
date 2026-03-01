import { differenceInHours, startOfWeek, endOfWeek } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"

export type EngineResult =
  | { ok: true; warnings?: string[] }
  | { ok: false; error: string }

export async function checkConflicts(
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeShiftId?: string
): Promise<EngineResult> {
  await connectDB()

  const shifts = await Shift.find({
    "assignments.user": staffId,
    _id: excludeShiftId ? { $ne: excludeShiftId } : { $exists: true },
  })

  for (const shift of shifts) {
    const overlaps =
      startTime < shift.end && endTime > shift.start

    if (overlaps) {
      return {
        ok: false,
        error: "Double booking detected.",
      }
    }

    const hoursAfterPrevious = differenceInHours(
      startTime,
      shift.end
    )

    if (hoursAfterPrevious > 0 && hoursAfterPrevious < 10) {
      return {
        ok: false,
        error: "10-hour rest rule violated.",
      }
    }
  }

  return { ok: true }
}

export async function calculateOvertime(
  staffId: string,
  referenceDate: Date
) {
  await connectDB()

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

  const shifts = await Shift.find({
    "assignments.user": staffId,
    start: { $gte: weekStart, $lte: weekEnd },
  })

  let totalHours = 0

  for (const shift of shifts) {
    totalHours +=
      (shift.end.getTime() - shift.start.getTime()) /
      (1000 * 60 * 60)
  }

  return {
    totalHours,
    hardBlock: totalHours > 50,
    warnings: totalHours >= 35 ? ["Approaching 40h limit"] : [],
  }
}

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