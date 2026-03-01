import mongoose from "mongoose"
import dotenv from "dotenv"

import User from "../models/User"; 
import Location from "../models/Location";
import Shift from "../models/Shift";

dotenv.config()

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    console.log("Connected to DB")

    // Clear existing data
    await User.deleteMany({})
    await Location.deleteMany({})
    await Shift.deleteMany({})

    console.log("Old data cleared")

    // Create manager
    const manager = await User.create({
      name: "Daniel Manager",
      email: "manager@test.com",
      role: "MANAGER",
    })

    // Create staff
    const staff1 = await User.create({
      name: "John Staff",
      email: "john@test.com",
      role: "STAFF",
    })

    const staff2 = await User.create({
      name: "Sarah Staff",
      email: "sarah@test.com",
      role: "STAFF",
    })

    // Create location
    const location = await Location.create({
      name: "Main Hospital",
    })

    // Create shifts
    await Shift.create([
      {
        location: location._id,
        title: "Morning Shift",
        start: new Date("2026-03-05T08:00:00"),
        end: new Date("2026-03-05T16:00:00"),
        headcount: 2,
        status: "DRAFT",
        createdBy: manager._id,
        assignments: [
          { user: staff1._id },
        ],
      },
      {
        location: location._id,
        title: "Night Shift",
        start: new Date("2026-03-06T20:00:00"),
        end: new Date("2026-03-07T06:00:00"),
        headcount: 2,
        status: "PUBLISHED",
        createdBy: manager._id,
        assignments: [
          { user: staff1._id },
          { user: staff2._id },
        ],
      },
    ])

    console.log("Dummy data created successfully")
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

seed()