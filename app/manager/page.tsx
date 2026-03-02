import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import Location from "@/models/Location"
import User from "@/models/User"
import ManagerUI from "./ManagerUI"

export default async function ManagerDashboard() {
  await connectDB()

  const shifts = await Shift.find()
    .populate("location")
    .populate("assignments.user")
    .sort({ start: 1 })
    .lean()

  const locations = await Location.find().lean()
  const staff = await User.find({ role: "STAFF" }).lean()

  return (
    <ManagerUI
      initialShifts={JSON.parse(JSON.stringify(shifts))}
      locations={JSON.parse(JSON.stringify(locations))}
      staff={JSON.parse(JSON.stringify(staff))}
    />
  )
}