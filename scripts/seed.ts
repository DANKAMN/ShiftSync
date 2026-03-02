// import mongoose from "mongoose"
// import dotenv from "dotenv"

// import User from "../models/User"
// import Location from "../models/Location"
// import Shift from "../models/Shift"
// import Skill from "../models/Skill"
// import Availability from "../models/Availability"

// dotenv.config()

// async function seed() {
//   try {
//     if (!process.env.MONGODB_URI) {
//       throw new Error("MONGODB_URI is not defined in .env")
//     }
//     await mongoose.connect(process.env.MONGODB_URI)
//     console.log("✅ Connected to DB")

//     // Clear existing
//     await Promise.all([
//       User.deleteMany({}),
//       Location.deleteMany({}),
//       Shift.deleteMany({}),
//       Skill.deleteMany({}),
//       Availability.deleteMany({}),
//     ])
//     console.log("🧹 Old data cleared")

//     const nursingSkill = await Skill.create({ name: "Nursing" })

//     const rawPassword = "password123" // <<-- plaintext; model pre-save will hash this once

//     // Manager
//     const manager = await User.create({
//       name: "Daniel Manager",
//       email: "manager@test.com",
//       role: "MANAGER",
//       password: rawPassword,
//     })

//     const location = await Location.create({
//       name: "Main Hospital",
//       address: "123 Health St",
//       timezone: "Africa/Lagos",
//       managers: [manager._id],
//     })

//     // Staff 1 - Alice (available)
//     const alice = await User.create({
//       name: "Alice Available",
//       email: "alice@test.com",
//       role: "STAFF",
//       password: rawPassword,
//       skills: [nursingSkill._id],
//       certifications: [location._id],
//       weeklyAvailability: [
//         { weekday: 1, start: "08:00", end: "20:00" },
//         { weekday: 2, start: "08:00", end: "20:00" },
//         { weekday: 3, start: "08:00", end: "20:00" },
//         { weekday: 4, start: "08:00", end: "20:00" },
//         { weekday: 5, start: "08:00", end: "20:00" },
//       ],
//     })

//     // Staff 2 - Bob Busy
//     const bob = await User.create({
//       name: "Bob Busy",
//       email: "bob@test.com",
//       role: "STAFF",
//       password: rawPassword,
//       skills: [nursingSkill._id],
//       certifications: [location._id],
//       weeklyAvailability: [{ weekday: 1, start: "08:00", end: "12:00" }],
//     })

//     await Availability.create({
//       user: bob._id,
//       type: "EXCEPTION",
//       date: new Date("2026-05-01"),
//       isAvailable: false,
//     })

//     // Staff 3 - Charlie uncertified
//     const charlie = await User.create({
//       name: "Charlie Uncertified",
//       email: "charlie@test.com",
//       role: "STAFF",
//       password: rawPassword,
//       skills: [nursingSkill._id],
//       certifications: [],
//       weeklyAvailability: [
//         { weekday: 1, start: "08:00", end: "20:00" },
//         { weekday: 2, start: "08:00", end: "20:00" },
//         { weekday: 3, start: "08:00", end: "20:00" },
//         { weekday: 4, start: "08:00", end: "20:00" },
//         { weekday: 5, start: "08:00", end: "20:00" },
//       ],
//     })

//     // existing shift for Alice (conflict test)
//     await Shift.create({
//       location: location._id,
//       title: "Existing Shift for Alice",
//       start: new Date("2026-05-05T09:00:00Z"),
//       end: new Date("2026-05-05T17:00:00Z"),
//       requiredSkill: nursingSkill._id,
//       headcount: 1,
//       status: "PUBLISHED",
//       assignments: [{ user: alice._id, status: "ASSIGNED" }],
//     })

//     console.log("✅ Seed complete. Login using password: password123")
//     console.log("manager@test.com / alice@test.com / bob@test.com / charlie@test.com -> password123")
//     process.exit(0)
//   } catch (err) {
//     console.error("❌ Seed failed:", err)
//     process.exit(1)
//   }
// }

// seed()

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

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Location.deleteMany({}),
      Shift.deleteMany({}),
      Skill.deleteMany({}),
      Availability.deleteMany({}),
    ])
    console.log("🧹 Old data cleared")

    // 2. Create Restaurant Skills
    const skills = await Skill.create([
      { name: "Bartender" },
      { name: "Line Cook" },
      { name: "Server" },
      { name: "Host" }
    ])
    const [bartender, lineCook, server, host] = skills
    console.log("🍳 Restaurant skills created")

    const rawPassword = "password123"

    // 3. Create Admin & Managers
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@test.com",
      role: "ADMIN",
      password: rawPassword,
    })

    const managerEast = await User.create({
      name: "East Coast Manager",
      email: "manager1@test.com",
      role: "MANAGER",
      password: rawPassword,
    })

    const managerWest = await User.create({
      name: "West Coast Manager",
      email: "manager2@test.com",
      role: "MANAGER",
      password: rawPassword,
    })

    // 4. Create 4 Locations across 2 Timezones
    const locations = await Location.create([
      {
        name: "The Pier (NYC)",
        address: "100 Ocean Blvd, NY",
        timezone: "America/New_York",
        managers: [managerEast._id]
      },
      {
        name: "Sunset Grill (Miami)",
        address: "50 Beach Dr, FL",
        timezone: "America/New_York",
        managers: [managerEast._id]
      },
      {
        name: "Mountain Bistro (Seattle)",
        address: "99 Alpine Way, WA",
        timezone: "America/Los_Angeles",
        managers: [managerWest._id]
      },
      {
        name: "City Diner (LA)",
        address: "22 Hollywood Blvd, CA",
        timezone: "America/Los_Angeles",
        managers: [managerWest._id]
      }
    ])
    const [pier, grill, bistro, diner] = locations
    console.log("📍 4 locations created across EST/PST")

    // 5. Create Diverse Staff
    
    // STAFF 1: "Expert Alice" (Multi-talented, multi-certified)
    const alice = await User.create({
      name: "Alice Expert",
      email: "alice@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [bartender._id, server._id],
      certifications: [pier._id, grill._id], // Certified for East Coast branches
      weeklyAvailability: [
        { weekday: 1, start: "16:00", end: "23:59" }, // Mon Night
        { weekday: 3, start: "16:00", end: "23:59" }, // Wed Night
        { weekday: 5, start: "16:00", end: "23:59" }, // Fri Night
      ]
    })

    // STAFF 2: "Bob Cook" (Specific skill, West Coast only)
    const bob = await User.create({
      name: "Bob Cook",
      email: "bob@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [lineCook._id],
      certifications: [bistro._id, diner._id],
      weeklyAvailability: [
        { weekday: 1, start: "08:00", end: "16:00" },
        { weekday: 2, start: "08:00", end: "16:00" },
        { weekday: 3, start: "08:00", end: "16:00" },
        { weekday: 4, start: "08:00", end: "16:00" },
        { weekday: 5, start: "08:00", end: "16:00" },
      ]
    })

    // STAFF 3: "Charlie Host" (Server, limited availability)
    const charlie = await User.create({
      name: "Charlie Host",
      email: "charlie@test.com",
      role: "STAFF",
      password: rawPassword,
      skills: [host._id],
      certifications: [pier._id], // Only works at The Pier
      weeklyAvailability: [
        { weekday: 6, start: "09:00", end: "21:00" }, // Saturday
        { weekday: 0, start: "09:00", end: "21:00" }, // Sunday
      ]
    })

    // 6. Create Exceptions
    await Availability.create({
      user: alice._id,
      type: "EXCEPTION",
      date: new Date("2026-04-10"), // Day off
      isAvailable: false,
    })

    // 7. Create some Initial Shifts
    await Shift.create([
      {
        location: pier._id,
        title: "Saturday Dinner Rush",
        start: new Date("2026-03-07T17:00:00Z"),
        end: new Date("2026-03-07T22:00:00Z"),
        requiredSkill: host._id,
        headcount: 1,
        status: "PUBLISHED",
        assignments: [{ user: charlie._id }]
      },
      {
        location: bistro._id,
        title: "Lunch Prep",
        start: new Date("2026-03-05T08:00:00Z"),
        end: new Date("2026-03-05T14:00:00Z"),
        requiredSkill: lineCook._id,
        headcount: 1,
        status: "DRAFT",
        assignments: [{ user: bob._id }]
      }
    ])

    console.log("✅ Coastal Eats Seeding Complete!")
    console.log(`
      LOGINS (Password: password123):
      - admin@test.com (Admin)
      - manager1@test.com (East Coast Manager)
      - manager2@test.com (West Coast Manager)
      - alice@test.com (Bartender/Server - NYC/Miami)
      - bob@test.com (Line Cook - Seattle/LA)
      - charlie@test.com (Host - NYC Only)
    `)
    process.exit(0)
  } catch (err) {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  }
}

seed()