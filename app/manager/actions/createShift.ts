"use server"

import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import User from "@/models/User"
import { checkConflicts, calculateOvertime } from "@/lib/logic/scheduler"

interface CreateShiftInput {
  locationId: string
  title?: string
  start: Date
  end: Date
  requiredSkillId?: string
  headcount: number
  assignedStaffIds?: string[]
}

export async function createShift(data: CreateShiftInput) {
  await connectDB()

  const {
    locationId,
    title,
    start,
    end,
    requiredSkillId,
    headcount,
    assignedStaffIds = [],
  } = data

  if (end <= start) {
    return { ok: false, error: "Shift end must be after start." }
  }

  // Create shift (DRAFT)
  const shift = await Shift.create({
    location: locationId,
    title,
    start,
    end,
    requiredSkill: requiredSkillId,
    headcount,
    status: "DRAFT",
    assignments: [],
  })

  // Validate & assign staff
  for (const staffId of assignedStaffIds) {
    // 1. Skill validation (simple inline check)
    if (requiredSkillId) {
      const user = await User.findById(staffId)
      if (!user?.skills?.includes(requiredSkillId as any)) {
        return {
          ok: false,
          error: "Staff lacks required skill.",
        }
      }
    }

    // 2. Conflict check
    const conflictCheck = await checkConflicts(
      staffId,
      start,
      end
    )

    if (!conflictCheck.ok) {
      return conflictCheck
    }

    // 3. Overtime check
    const overtime = await calculateOvertime(staffId, start)
    if (overtime.hardBlock) {
      return {
        ok: false,
        error: "Assignment violates overtime hard limits.",
      }
    }

    // Push assignment
    shift.assignments.push({
      user: staffId,
      status: "ASSIGNED",
    })
  }

  await shift.save()

  return { ok: true, shiftId: shift._id.toString() }
}