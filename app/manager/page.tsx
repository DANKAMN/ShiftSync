// import { connectDB } from "@/lib/mongodb"
// import Shift from "@/models/Shift"
// import Location from "@/models/Location"
// import User from "@/models/User"
// import ManagerUI from "./ManagerUI"

// export default async function ManagerDashboard() {
//   await connectDB()

//   const shifts = await Shift.find()
//     .populate("location")
//     .populate("assignments.user")
//     .sort({ start: 1 })
//     .lean()

//   const locations = await Location.find().lean()
//   const staff = await User.find({ role: "STAFF" }).lean()

//   return (
//     <ManagerUI
//       initialShifts={JSON.parse(JSON.stringify(shifts))}
//       locations={JSON.parse(JSON.stringify(locations))}
//       staff={JSON.parse(JSON.stringify(staff))}
//     />
//   )
// }

// app/manager/page.tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import Location from "@/models/Location"
import User from "@/models/User"
import ManagerUI from "./ManagerUI"

export default async function ManagerDashboard() {
  // 1. require session + role (server-side)
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    // not signed in -> redirect to login
    redirect("/auth/login")
  }

  const role = session.user.role

  // only MANAGER and ADMIN allowed
  if (role !== "MANAGER" && role !== "ADMIN") {
    // unauthorized -> redirect to homepage or login
    redirect("/")
  }

  // 2. Connect DB and fetch data (safely)
  await connectDB()

  // fetch shifts, populate location and assignments.user but exclude passwords
  const shifts = await Shift.find()
    .populate("location")
    .populate({
      path: "assignments.user",
      select: "name email role", // exclude password
    })
    .sort({ start: 1 })
    .lean()

  // locations (safe)
  const locations = await Location.find().lean()

  // staff list: only expose safe fields
  const staff = await User.find({ role: "STAFF" }).select("name email role").lean()

  // serialize for client (strip any ObjectIds left by mongoose)
  const safeShifts = JSON.parse(JSON.stringify(shifts))
  const safeLocations = JSON.parse(JSON.stringify(locations))
  const safeStaff = JSON.parse(JSON.stringify(staff))

  // manager name (fallback to role label)
  const managerName = session.user.name || (role === "ADMIN" ? "Admin" : "Manager")

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