"use client"

import { useState } from "react"
import { setWeeklyAvailability } from "./actions/setWeeklyAvailability"
import { createAvailabilityException } from "./actions/createAvailabilityException"
import { signOut } from "next-auth/react"

type WeeklyEntry = { weekday: number; start: string; end: string }

export default function StaffUI({
  initialMyShifts,
  initialAllShifts,
  initialWeeklyAvailability,
  initialExceptions,
  user,
}: any) {
  const [myShifts] = useState(initialMyShifts || [])
  const [allShifts] = useState(initialAllShifts || [])
  const [exceptions, setExceptions] = useState(initialExceptions || [])
  const [weekly, setWeekly] = useState<WeeklyEntry[]>(
    initialWeeklyAvailability || []
  )
  const [saving, setSaving] = useState(false)
  const [creatingEx, setCreatingEx] = useState(false)
  const [exDate, setExDate] = useState("")
  const [exAvailable, setExAvailable] = useState(false)

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]

  function toggleWeekday(d: number) {
    // if exists remove else add default 08:00-17:00
    const exists = weekly.find((w) => w.weekday === d)
    if (exists) {
      setWeekly(weekly.filter((w) => w.weekday !== d))
    } else {
      setWeekly([...weekly, { weekday: d, start: "08:00", end: "17:00" }])
    }
  }

  function updateEntry(day: number, field: "start" | "end", value: string) {
    setWeekly(
      weekly.map((w) => (w.weekday === day ? { ...w, [field]: value } : w))
    )
  }

  async function saveWeekly() {
    setSaving(true)
    try {
      const res = await setWeeklyAvailability(weekly)
      if (!res.ok) {
        alert("Failed: " + (res.error || "unknown"))
        return
      }
      alert("Saved weekly availability")
    } catch (e) {
      console.error(e)
      alert("Error saving")
    } finally {
      setSaving(false)
    }
  }

  async function createException() {
    if (!exDate) {
      alert("Pick date")
      return
    }
    setCreatingEx(true)
    try {
      const res = await createAvailabilityException({
        date: new Date(exDate),
        isAvailable: !exAvailable ? false : true,
        note: "",
      })
      if (!res.ok) {
        alert("Failed: " + (res.error || "unknown"))
        return
      }
      // append to state
      setExceptions((s:any) => [...s, { date: exDate, isAvailable: !exAvailable }])
      alert("Exception created")
      setExDate("")
    } catch (e) {
      console.error(e)
      alert("Error creating exception")
    } finally {
      setCreatingEx(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Schedule — {user?.name}</h1>
        <div>
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Availability editor */}
        <section className="col-span-1 border p-4 rounded">
          <h2 className="font-semibold mb-2">Set Weekly Availability</h2>
          <div className="space-y-2">
            {weekdays.map((label, idx) => {
              const entry = weekly.find((w) => w.weekday === idx)
              return (
                <div key={label} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!entry}
                    onChange={() => toggleWeekday(idx)}
                  />
                  <div className="w-24 text-sm">{label}</div>
                  <input
                    type="time"
                    value={entry?.start || "08:00"}
                    onChange={(e) => updateEntry(idx, "start", e.target.value)}
                    disabled={!entry}
                    className="border p-1 rounded"
                  />
                  <span>—</span>
                  <input
                    type="time"
                    value={entry?.end || "17:00"}
                    onChange={(e) => updateEntry(idx, "end", e.target.value)}
                    disabled={!entry}
                    className="border p-1 rounded"
                  />
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <button
              className={`px-4 py-2 rounded text-white ${saving ? "bg-gray-400" : "bg-blue-600"}`}
              onClick={saveWeekly}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Availability"}
            </button>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-2">Exceptions / Time Off</h3>
          <div className="flex items-center space-x-2">
            <input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} className="border p-1 rounded" />
            <label className="text-sm">Available?</label>
            <input type="checkbox" checked={exAvailable} onChange={() => setExAvailable((s) => !s)} />
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={createException} disabled={creatingEx}>
              {creatingEx ? "Creating..." : "Create Exception"}
            </button>
          </div>

          <div className="mt-3 text-sm">
            {exceptions.length === 0 ? <div className="text-gray-500">No exceptions</div> : (
              <ul className="text-sm space-y-1">
                {exceptions.map((ex: any, i: number) => (
                  <li key={i}>{new Date(ex.date).toDateString()} — {ex.isAvailable ? "Available" : "Unavailable"}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* My current shifts */}
        <section className="col-span-1 md:col-span-2 border p-4 rounded">
          <h2 className="font-semibold mb-2">My Shifts</h2>

          <div className="grid gap-3">
            {myShifts.length === 0 && <div className="text-gray-500">You have no shifts assigned.</div>}
            {myShifts.map((shift: any) => (
              <div key={shift._id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{shift.title || "Untitled"}</div>
                  <div className="text-sm text-gray-600">{shift.location?.name}</div>
                  <div className="text-xs mt-1">{new Date(shift.start).toLocaleString()} — {new Date(shift.end).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{shift.assignments?.length}/{shift.headcount}</div>
                  <div className="text-xs mt-1">{shift.status}</div>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-2">All Published Shifts (Browse)</h3>
          <div className="grid gap-3">
            {allShifts.length === 0 && <div className="text-gray-500">No published shifts yet.</div>}
            {allShifts.map((shift: any) => (
              <div key={shift._id} className="border rounded p-3 flex justify-between">
                <div>
                  <div className="font-medium">{shift.title || "Untitled"}</div>
                  <div className="text-sm text-gray-600">{shift.location?.name}</div>
                  <div className="text-xs mt-1">{new Date(shift.start).toLocaleString()} — {new Date(shift.end).toLocaleString()}</div>
                </div>
                <div className="text-sm text-right">
                  <div>{shift.assignments?.length}/{shift.headcount}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}