import { format } from "date-fns"
import Availability from "@/models/Availability"

export async function checkAvailability(
  staffId: string,
  start: Date,
  end: Date
) {
  const dayOfWeek = start.getDay()
  const dateStr = format(start, "yyyy-MM-dd")

  // 1️⃣ Check for specific exception
  const exception = await Availability.findOne({
    user: staffId,
    type: "EXCEPTION",
    date: {
      $gte: new Date(dateStr),
      $lte: new Date(dateStr + "T23:59:59"),
    },
  })

  if (exception) {
    if (!exception.isAvailable) {
      return {
        ok: false,
        error: "Staff marked unavailable for this date.",
      }
    }
  }

  // 2️⃣ Check weekly recurring
  const weekly = await Availability.findOne({
    user: staffId,
    type: "WEEKLY",
    dayOfWeek,
  })

  if (!weekly) {
    return {
      ok: false,
      error: "No availability set for this weekday.",
    }
  }

  const shiftStart = format(start, "HH:mm")
  const shiftEnd = format(end, "HH:mm")

  if (
    shiftStart < weekly.startTime ||
    shiftEnd > weekly.endTime
  ) {
    return {
      ok: false,
      error: "Shift outside of staff availability window.",
    }
  }

  return { ok: true }
}