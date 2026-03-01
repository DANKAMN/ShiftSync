import { PrismaClient } from "@prisma/client"
import { checkConflicts } from "@/lib/logic/scheduler"

const prisma = new PrismaClient()

export default async function ManagerDashboard() {
  const shifts = await prisma.shift.findMany({
    include: {
      assignments: {
        include: { user: true },
      },
      location: true,
    },
    orderBy: { start: "asc" },
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manager Calendar</h1>

      <div className="grid grid-cols-7 gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className={`border rounded p-3 ${
              shift.status === "DRAFT"
                ? "bg-yellow-100"
                : "bg-green-100"
            }`}
          >
            <div className="font-semibold">
              {shift.title || "Untitled Shift"}
            </div>

            <div className="text-sm">
              {shift.location.name}
            </div>

            <div className="text-xs">
              {new Date(shift.start).toLocaleString()} -{" "}
              {new Date(shift.end).toLocaleString()}
            </div>

            <div className="mt-2 text-xs">
              {shift.assignments.length} / {shift.headcount} Assigned
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}