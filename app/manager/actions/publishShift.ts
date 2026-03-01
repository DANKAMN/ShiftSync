"use server"

import { PrismaClient, ShiftStatus } from "@prisma/client"
import { differenceInHours } from "date-fns"

const prisma = new PrismaClient()

export async function publishShift(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  })

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
      error: "Cannot publish or edit shift within 48 hours of start.",
    }
  }

  await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  })

  return { ok: true }
}