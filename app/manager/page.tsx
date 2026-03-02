import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import Location from "@/models/Location"
import User from "@/models/User"
import ManagerUI from "./ManagerUI"

export default async function ManagerDashboard() {
  // 1. Server-side session + role guard
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const role = session.user.role

  // Only MANAGER and ADMIN allowed
  if (role !== "MANAGER" && role !== "ADMIN") {
    redirect("/")
  }

  await connectDB()

  // 2. If ADMIN -> full access
  if (role === "ADMIN") {
    const shifts = await Shift.find()
      .populate("location")
      .populate({
        path: "assignments.user",
        select: "name email role",
      })
      .sort({ start: 1 })
      .lean()

    const locations = await Location.find().lean()
    const staff = await User.find({ role: "STAFF" }).select("name email role certifications").lean()

    return (
      <ManagerUI
        initialShifts={JSON.parse(JSON.stringify(shifts))}
        locations={JSON.parse(JSON.stringify(locations))}
        staff={JSON.parse(JSON.stringify(staff))}
        managerName={session.user.name || "Admin"}
        managerRole={role}
      />
    )
  }

  // 3. MANAGER: scope to only locations they manage
  const managerId = session.user.id

  // find locations where this manager is listed
  const managedLocations = await Location.find({ managers: managerId }).lean()
  const managedLocationIds = managedLocations.map((l: any) => l._id)

  // Fetch shifts only for managed locations
  const shifts = await Shift.find({
    location: { $in: managedLocationIds },
  })
    .populate("location")
    .populate({
      path: "assignments.user",
      select: "name email role",
    })
    .sort({ start: 1 })
    .lean()

  // Only the locations this manager manages
  const locations = managedLocations

  // Staff scoped to those certified for any of the manager's locations
  // (so manager can only assign certified staff by default)
  const staff = await User.find({
    role: "STAFF",
    certifications: { $in: managedLocationIds },
  })
    .select("name email role certifications")
    .lean()

  // Serialize safe plain objects for client
  const safeShifts = JSON.parse(JSON.stringify(shifts))
  const safeLocations = JSON.parse(JSON.stringify(locations))
  const safeStaff = JSON.parse(JSON.stringify(staff))

  const managerName = session.user.name || "Manager"

  return (
    <ManagerUI
      initialShifts={safeShifts}
      locations={safeLocations}
      staff={safeStaff}
      managerName={managerName}
      managerRole={role}
    />
  )
}