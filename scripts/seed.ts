import mongoose from "mongoose"
import dotenv from "dotenv"

// Import models
import User from "../models/User"
import Location from "../models/Location"
import Shift from "../models/Shift"
import Skill from "../models/Skill"
import Availability from "../models/Availability"

dotenv.config()

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env")
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to DB")

    // 1. Clear all collections (Clean Slate)
    await Promise.all([
      User.deleteMany({}),
      Location.deleteMany({}),
      Shift.deleteMany({}),
      Skill.deleteMany({}),
      Availability.deleteMany({})
    ])
    console.log("🧹 Old data cleared")

    // 2. Create Base Data (Skills & Locations)
    const nursingSkill = await Skill.create({ name: "Nursing" })
    
    // Create Manager
    const manager = await User.create({
      name: "Daniel Manager",
      email: "manager@test.com",
      role: "MANAGER",
    })

    const location = await Location.create({
      name: "Main Hospital",
      address: "123 Health St",
      timezone: "Africa/Lagos",
      managers: [manager._id]
    })
    
    console.log("🏥 Location and Skills created")

    // ---------------------------------------------------------
    // 3. Create The 3 Test Staff Members
    // ---------------------------------------------------------

    // STAFF 1: "Alice Available" 
    // ✅ Certified 
    // ✅ Has Skill 
    // ✅ Wide Open Availability
    const alice = await User.create({
      name: "Alice Available",
      email: "alice@test.com",
      role: "STAFF",
      skills: [nursingSkill._id],
      certifications: [location._id], // She is certified here
      weeklyAvailability: [
        // Available Mon(1) - Fri(5), 8am to 8pm
        { weekday: 1, start: "08:00", end: "20:00" },
        { weekday: 2, start: "08:00", end: "20:00" },
        { weekday: 3, start: "08:00", end: "20:00" },
        { weekday: 4, start: "08:00", end: "20:00" },
        { weekday: 5, start: "08:00", end: "20:00" },
      ]
    })

    // STAFF 2: "Bob Busy" 
    // ✅ Certified 
    // ✅ Has Skill 
    // ❌ BUSY (Conflict or Unavailable)
    const bob = await User.create({
      name: "Bob Busy",
      email: "bob@test.com",
      role: "STAFF",
      skills: [nursingSkill._id],
      certifications: [location._id], // He is certified
      weeklyAvailability: [
        // Only available Mondays 8am-12pm
        { weekday: 1, start: "08:00", end: "12:00" } 
      ]
    })

    // Let's also give Bob a specific Time Off request (Exception)
    // He is taking off May 1st, 2026
    await Availability.create({
      user: bob._id,
      type: "EXCEPTION",
      date: new Date("2026-05-01"), // Worker's Day?
      isAvailable: false
    })

    // STAFF 3: "Charlie Uncertified"
    // ❌ NOT Certified 
    // ✅ Has Skill
    // ✅ Available
    const charlie = await User.create({
      name: "Charlie Uncertified",
      email: "charlie@test.com",
      role: "STAFF",
      skills: [nursingSkill._id],
      certifications: [], // Empty certifications!
      weeklyAvailability: [
        { weekday: 1, start: "08:00", end: "20:00" },
        { weekday: 2, start: "08:00", end: "20:00" },
        { weekday: 3, start: "08:00", end: "20:00" },
        { weekday: 4, start: "08:00", end: "20:00" },
        { weekday: 5, start: "08:00", end: "20:00" },
      ]
    })

    console.log("👥 Staff created: Alice (Valid), Bob (Busy), Charlie (Uncertified)")

    // ---------------------------------------------------------
    // 4. Create a Conflict Scenario
    // ---------------------------------------------------------

    // We assign Alice to a shift on May 5th.
    // If you try to create ANOTHER shift for Alice at the same time, it should fail.
    await Shift.create({
      location: location._id,
      title: "Existing Shift for Alice",
      start: new Date("2026-05-05T09:00:00"),
      end: new Date("2026-05-05T17:00:00"),
      requiredSkill: nursingSkill._id,
      headcount: 1,
      status: "PUBLISHED",
      assignments: [
        { user: alice._id, status: "ASSIGNED" }
      ]
    })

    console.log("📅 Existing shift created for Alice (to test double-booking)")
    console.log("✅ Seed complete")
    process.exit(0)

  } catch (error) {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  }
}

seed()