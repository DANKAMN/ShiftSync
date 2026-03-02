"use client"

import { useState } from "react"
import { createShift } from "./actions/createShift"
import { publishShift } from "./actions/publishShift"

export default function ManagerUI({
  initialShifts,
  locations,
  staff,
}: any) {
  const [shifts, setShifts] = useState(initialShifts)
  const [submitting, setSubmitting] = useState(false) // Added submitting state
  const [form, setForm] = useState({
    locationId: "",
    title: "",
    start: "",
    end: "",
    headcount: 1,
    assignedStaffIds: [] as string[],
  })

  const handleCreate = async () => {
    // 1. Prevent duplicate submissions
    if (submitting) return
    
    setSubmitting(true)

    try {
      const result = await createShift({
        locationId: form.locationId,
        title: form.title,
        start: new Date(form.start),
        end: new Date(form.end),
        headcount: Number(form.headcount),
        assignedStaffIds: form.assignedStaffIds,
      })

      if (!result.ok) {
        // Here is where your new "Hardened" logic displays suggestions or warnings
        alert(result.error)
        console.log("Details:", result.suggestions || result.warnings)
        return
      }

      alert("Shift created successfully")
      location.reload()
    } catch (err) {
      console.error("Failed to create shift:", err)
      alert("An unexpected error occurred.")
    } finally {
      // 2. Always reset submitting state regardless of success or failure
      setSubmitting(false)
    }
  }

  const handlePublish = async (id: string) => {
    const result = await publishShift(id)
    if (!result.ok) {
      alert(result.error)
      return
    }
    alert("Published")
    location.reload()
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>

      {/* CREATE SHIFT FORM */}
      <div className="border p-4 rounded space-y-3 bg-purple-400 shadow-sm">
        <h2 className="font-semibold text-lg">Create New Shift</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="border p-2 rounded"
            onChange={(e) =>
              setForm({ ...form, locationId: e.target.value })
            }
          >
            <option value="">Select Location</option>
            {locations.map((loc: any) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Shift Title (e.g. Morning Guard)"
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Start Date/Time</label>
            <input
              className="border p-2 rounded"
              type="datetime-local"
              onChange={(e) =>
                setForm({ ...form, start: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500">End Date/Time</label>
            <input
              className="border p-2 rounded"
              type="datetime-local"
              onChange={(e) =>
                setForm({ ...form, end: e.target.value })
              }
            />
          </div>
        </div>

        <input
          className="border p-2 rounded w-full"
          type="number"
          placeholder="Headcount"
          value={form.headcount}
          onChange={(e) =>
            setForm({ ...form, headcount: Number(e.target.value) })
          }
        />

        <div className="border-t pt-3">
          <label className="font-medium block mb-2">Assign Staff:</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {staff.map((s: any) => (
              <div key={s._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={s._id}
                  value={s._id}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({
                        ...form,
                        assignedStaffIds: [...form.assignedStaffIds, s._id],
                      })
                    } else {
                      setForm({
                        ...form,
                        assignedStaffIds: form.assignedStaffIds.filter((id) => id !== s._id),
                      })
                    }
                  }}
                />
                <label htmlFor={s._id} className="text-sm cursor-pointer">{s.name}</label>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Updated Button with Loading State */}
        <button
          disabled={submitting}
          className={`w-full mt-4 font-bold text-white px-4 py-2 rounded transition-colors ${
            submitting 
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleCreate}
        >
          {submitting ? "Creating..." : "Create Shift"}
        </button>
      </div>

      {/* SHIFT LIST */}
      <h2 className="font-semibold text-xl">Current Shifts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift: any) => (
          <div
            key={shift._id}
            className={`border rounded-lg p-4 shadow-sm ${
              shift.status === "DRAFT"
                ? "border-yellow-300 bg-yellow-500"
                : "border-green-300 bg-green-500"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-lg">{shift.title || "Untitled Shift"}</div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                shift.status === "DRAFT" ? "bg-yellow-300 text-yellow-800" : "bg-green-300 text-green-800"
              }`}>
                {shift.status}
              </span>
            </div>

            <div className="text-sm text-gray-600">{shift.location?.name}</div>

            <div className="text-sm mt-2 font-mono">
              {new Date(shift.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>

            <div className="text-sm mt-1 mb-3">
              Staff: <span className="font-bold">{shift.assignments?.length}</span> / {shift.headcount}
            </div>

            {shift.status === "DRAFT" && (
              <button
                className="w-full text-sm bg-black hover:bg-gray-800 text-white font-bold px-2 py-2 rounded"
                onClick={() => handlePublish(shift._id)}
              >
                Publish Shift
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}