import mongoose from "mongoose"
// 1. Force-import all models here to register their schemas immediately
import "@/models/User"
import "@/models/Location"
import "@/models/Shift"
import "@/models/Skill"
import "@/models/Availability"

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) throw new Error("MONGODB_URI not defined")

// Use a more standard global key to avoid conflicts
declare global {
  var mongoose: { conn: unknown; promise: unknown }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "shift-sync",
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected & Models Registered")
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}