import mongoose from "mongoose"
import dotenv from "dotenv"

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

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Location.deleteMany({}),
      Shift.deleteMany({}),
      Skill.deleteMany({}),
      Availability.deleteMany({}),
    ])
    console.log("🧹 Old data cleared")

    const nursingSkill = await Skill.create({ name: "Nursing" })

    const rawPassword = "password123" // <<-- plaintext; model pre-save will hash this once

    // Manager
    const manager = await User.create({
      name: "Daniel Manager",
      email: "manager@test.com",
      role: "MANAGER",
      password: rawPassword,
    })

    const location = await Location.create({
      name: "Main Hospital",
      address: "123 Health St",
      timezone: "Africa/Lagos",
      managers: [manager._id],
    })

    // Staff 1 - Alice (available)
    const alice = await User.create({
      name: "Alice Available",
      email: "alice@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [nursingSkill._id],
      certifications: [location._id],
      weeklyAvailability: [
        { weekday: 1, start: "08:00", end: "20:00" },
        { weekday: 2, start: "08:00", end: "20:00" },
        { weekday: 3, start: "08:00", end: "20:00" },
        { weekday: 4, start: "08:00", end: "20:00" },
        { weekday: 5, start: "08:00", end: "20:00" },
      ],
    })

    // Staff 2 - Bob Busy
    const bob = await User.create({
      name: "Bob Busy",
      email: "bob@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [nursingSkill._id],
      certifications: [location._id],
      weeklyAvailability: [{ weekday: 1, start: "08:00", end: "12:00" }],
    })

    await Availability.create({
      user: bob._id,
      type: "EXCEPTION",
      date: new Date("2026-05-01"),
      isAvailable: false,
    })

    // Staff 3 - Charlie uncertified
    const charlie = await User.create({
      name: "Charlie Uncertified",
      email: "charlie@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [nursingSkill._id],
      certifications: [],
      weeklyAvailability: [
        { weekday: 1, start: "08:00", end: "20:00" },
        { weekday: 2, start: "08:00", end: "20:00" },
        { weekday: 3, start: "08:00", end: "20:00" },
        { weekday: 4, start: "08:00", end: "20:00" },
        { weekday: 5, start: "08:00", end: "20:00" },
      ],
    })

    // existing shift for Alice (conflict test)
    await Shift.create({
      location: location._id,
      title: "Existing Shift for Alice",
      start: new Date("2026-05-05T09:00:00Z"),
      end: new Date("2026-05-05T17:00:00Z"),
      requiredSkill: nursingSkill._id,
      headcount: 1,
      status: "PUBLISHED",
      assignments: [{ user: alice._id, status: "ASSIGNED" }],
    })

    console.log("✅ Seed complete. Login using password: password123")
    console.log("manager@test.com / alice@test.com / bob@test.com / charlie@test.com -> password123")
    process.exit(0)
  } catch (err) {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  }
}

seed()