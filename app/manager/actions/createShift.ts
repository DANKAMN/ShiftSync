"use server"

import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import User from "@/models/User"
import { checkConflicts, projectIfAssigned } from "@/lib/logic/scheduler"
import { checkAvailability } from "@/lib/logic/availability"
import { findAlternatives } from "@/lib/logic/suggestions"

/**
 * Improved createShift:
 * - Validate ALL assignedStaffIds up-front (certification, skill, availability, conflicts, projections)
 * - If ANY validation fails: return error + suggestions and DO NOT create shift (no dangling draft)
 * - If all pass: create shift with assignments atomically.
 */

interface CreateShiftInput {
  locationId: string
  title?: string
  start: Date
  end: Date
  requiredSkillId?: string
  headcount: number
  assignedStaffIds?: string[]
  createdById?: string
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
    createdById,
  } = data

  if (end <= start) return { ok: false, error: "Shift end must be after start." }

  // quick headcount check
  if (assignedStaffIds.length > headcount) {
    return { ok: false, error: "Assigned staff exceed headcount." }
  }

  // Validate each staff BEFORE creating shift
  const suggestionsPerUser: Record<string, any> = {}
  for (const staffId of assignedStaffIds) {
    const user = await User.findById(staffId).lean()
    if (!user) return { ok: false, error: "Assigned user not found." }

    // Certification check
    const certified = (user.certifications || []).map((c: any) => c.toString()).includes(locationId)
    if (!certified) {
      const alternatives = await findAlternatives(locationId, requiredSkillId, start, end, 3)
      return {
        ok: false,
        error: `Staff ${user.name || staffId} is not certified for this location.`,
        suggestions: alternatives,
      }
    }

    // Skill check
    if (requiredSkillId) {
      const hasSkill = (user.skills || []).map((s: any) => s.toString()).includes(requiredSkillId)
      if (!hasSkill) {
        const alternatives = await findAlternatives(locationId, requiredSkillId, start, end, 3)
        return {
          ok: false,
          error: `Staff ${user.name || staffId} does not have the required skill.`,
          suggestions: alternatives,
        }
      }
    }

    // Availability check (this now checks Availability collection and falls back to User.weeklyAvailability)
    const avail = await checkAvailability(staffId, start, end)
    if (!avail.ok) {
      const alternatives = await findAlternatives(locationId, requiredSkillId, start, end, 3)
      return {
        ok: false,
        error: `Staff ${user.name || staffId} unavailable: ${avail.error}`,
        suggestions: alternatives,
      }
    }

    // Conflict check & rest rule
    const conflict = await checkConflicts(staffId, start, end)
    if (!conflict.ok) {
      const alternatives = await findAlternatives(locationId, requiredSkillId, start, end, 3)
      return {
        ok: false,
        error: `Staff ${user.name || staffId} conflict: ${conflict.error}`,
        suggestions: alternatives,
      }
    }

    // Projection (what-if)
    const projection = await projectIfAssigned(staffId, start, end)
    if (projection.hardBlock) {
      return {
        ok: false,
        error: `Assigning this shift would violate hard labor limits for ${user.name || staffId}.`,
        warnings: projection.warnings,
      }
    }

    if (projection.warnings?.length) {
      suggestionsPerUser[staffId] = projection.warnings
    }
  }

  // All validations passed -> create shift with assignments
  const assignments = assignedStaffIds.map((id) => ({ user: id, status: "ASSIGNED" }))

  const shift = await Shift.create({
    location: locationId,
    title,
    start,
    end,
    requiredSkill: requiredSkillId,
    headcount,
    status: "DRAFT",
    assignments,
    createdBy: createdById,
  })

  const warnings = Object.values(suggestionsPerUser).flat()
  return { ok: true, shiftId: shift._id.toString(), warnings }
}