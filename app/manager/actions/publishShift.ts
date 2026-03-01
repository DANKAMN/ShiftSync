"use server"

import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import { differenceInHours } from "date-fns"

export async function publishShift(shiftId: string) {
  await connectDB()

  const shift = await Shift.findById(shiftId)

  if (!shift) {
    return { ok: false, error: "Shift not found." }
  }

  const hoursUntilStart = differenceInHours(
    shift.start,
    new Date()
  )

  if (hoursUntilStart < 48) {
    return {
      ok: false,
      error: "Cannot publish within 48 hours of start.",
    }
  }

  shift.status = "PUBLISHED"
  await shift.save()

  return { ok: true }
}