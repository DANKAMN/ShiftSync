"use server"

import { PrismaClient, ShiftStatus } from "@prisma/client"
import { checkConflicts, validateSkill, calculateOvertime } from "@/lib/logic/scheduler"

const prisma = new PrismaClient()

interface CreateShiftInput {
  locationId: string
  title?: string
  start: Date
  end: Date
  requiredSkillId?: string
  headcount: number
  assignedStaffIds?: string[]
  createdById: string
}

export async function createShift(data: CreateShiftInput) {
  const {
    locationId,
    title,
    start,
    end,
    requiredSkillId,
    headcount,
    assignedStaffIds = [],
    createdById,
  } = data

  if (end <= start) {
    return { ok: false, error: "Shift end must be after start." }
  }

  // Create shift first (DRAFT)
  const shift = await prisma.shift.create({
    data: {
      locationId,
      title,
      start,
      end,
      requiredSkillId,
      headcount,
      createdById,
      status: ShiftStatus.DRAFT,
    },
  })

  // Assign staff with engine validations
  for (const staffId of assignedStaffIds) {
    const skillCheck = await validateSkill(staffId, shift.id)
    if (!skillCheck.ok) {
      return skillCheck
    }

    const conflictCheck = await checkConflicts(
      staffId,
      start,
      end
    )
    if (!conflictCheck.ok) {
      return conflictCheck
    }

    const overtime = await calculateOvertime(staffId, start)
    if (overtime.hardBlock) {
      return {
        ok: false,
        error: "Assignment violates overtime hard limits.",
      }
    }

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: staffId,
      },
    })
  }

  return { ok: true, shiftId: shift.id }
}