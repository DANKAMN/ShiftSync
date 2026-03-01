import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import Location from "@/models/Location" 
import User from "@/models/User"

export default async function ManagerDashboard() {
  await connectDB()

  const shifts = await Shift.find()
    .populate("location")
    .populate("assignments.user")
    .sort({ start: 1 })
    .lean()

    console.log(shifts)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Manager Calendar
      </h1>

      <div className="grid grid-cols-7 gap-4">
        {shifts.map((shift: any) => (
          <div
            key={shift._id.toString()}
            className={`border rounded p-3 ${
              shift.status === "DRAFT"
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
          >
            <div className="font-semibold">
              {shift.title || "Untitled Shift"}
            </div>

            <div className="text-sm">
              {shift.location?.name || "Unknown Location"}
            </div>

            <div className="text-xs">
              {new Date(shift.start).toLocaleString()} -{" "}
              {new Date(shift.end).toLocaleString()}
            </div>

            <div className="mt-2 text-xs">
              {shift.assignments?.length || 0} /{" "}
              {shift.headcount} Assigned
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}