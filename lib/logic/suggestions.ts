// lib/logic/suggestions.ts
import User from "@/models/User"
import Shift from "@/models/Shift"
import { checkConflicts } from "./scheduler"
import { checkAvailability } from "./availability"

/**
 * findAlternatives(locationId, requiredSkillId, start, end, limit = 5)
 * returns array of users (id, name, reasonMatches)
 */
export async function findAlternatives(
  locationId: string,
  requiredSkillId: string | undefined,
  start: Date,
  end: Date,
  limit = 5
) {
  // Users who have the skill (if defined) and are certified for location
  const skillFilter = requiredSkillId ? { skills: requiredSkillId } : {}

  const candidates = await User.find({
    ...skillFilter,
    certifications: locationId, // certified for location
    role: "STAFF",
  })
    .limit(200)
    .lean()

  const results: Array<{ id: string; name?: string; reasons: string[] }> = []

  for (const u of candidates) {
    // 1. availability
    const avail = await checkAvailability(u._id.toString(), start, end)
    if (!avail.ok) {
      // still include as candidate with reason but continue checking conflicts
      const conflict = await checkConflicts(u._id.toString(), start, end)
      if (!conflict.ok) {
        continue
      }
      results.push({ id: u._id.toString(), name: u.name, reasons: [avail.error || "unavailable"] })
      if (results.length >= limit) break
      continue
    }

    // 2. conflicts
    const conflict = await checkConflicts(u._id.toString(), start, end)
    if (!conflict.ok) {
      continue
    }

    results.push({ id: u._id.toString(), name: u.name, reasons: ["available", "no conflicts"] })
    if (results.length >= limit) break
  }

  return results
}