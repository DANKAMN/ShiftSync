"use client"

import { useState } from "react"
import { setWeeklyAvailability } from "./actions/setWeeklyAvailability"
import { createAvailabilityException } from "./actions/createAvailabilityException"
// Assuming you might add a delete action later, for now we'll update local state
import { signOut } from "next-auth/react"
import { Calendar, Clock, Plus, Trash2, LogOut, Coffee } from "lucide-react"

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
  const [weekly, setWeekly] = useState<WeeklyEntry[]>(initialWeeklyAvailability || [])
  
  const [saving, setSaving] = useState(false)
  const [creatingEx, setCreatingEx] = useState(false)
  const [exDate, setExDate] = useState("")
  const [exType, setExType] = useState<"UNAVAILABLE" | "AVAILABLE">("UNAVAILABLE")

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  function toggleWeekday(d: number) {
    const exists = weekly.find((w) => w.weekday === d)
    if (exists) {
      setWeekly(weekly.filter((w) => w.weekday !== d))
    } else {
      setWeekly([...weekly, { weekday: d, start: "09:00", end: "17:00" }])
    }
  }

  function updateEntry(day: number, field: "start" | "end", value: string) {
    setWeekly(weekly.map((w) => (w.weekday === day ? { ...w, [field]: value } : w)))
  }

  async function saveWeekly() {
    setSaving(true)
    try {
      const res = await setWeeklyAvailability(weekly)
      if (!res.ok) throw new Error(res.error)
      alert("Weekly schedule updated!")
    } catch (e: any) {
      alert(e.message || "Error saving")
    } finally {
      setSaving(false)
    }
  }

  async function createException() {
    if (!exDate) return alert("Please select a date")
    setCreatingEx(true)
    try {
      const isAvailable = exType === "AVAILABLE"
      const res = await createAvailabilityException({
        date: new Date(exDate),
        isAvailable,
        note: "",
      })
      if (!res.ok) throw new Error(res.error)
      
      setExceptions([...exceptions, { date: exDate, isAvailable }])
      setExDate("")
      alert("Request added successfully")
    } catch (e: any) {
      alert(e.message || "Error creating exception")
    } finally {
      setCreatingEx(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 bg-zinc-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Staff Portal</h1>
          <p className="text-zinc-500">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-600 px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: AVAILABILITY */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Weekly Availability Card */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div className="flex items-center gap-2 mb-6 text-zinc-900">
              <Clock className="text-blue-600" size={20} />
              <h2 className="font-bold text-lg">Weekly Schedule</h2>
            </div>
            
            <div className="space-y-3">
              {weekdays.map((label, idx) => {
                const entry = weekly.find((w) => w.weekday === idx)
                return (
                  <div key={label} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${entry ? 'bg-blue-50/50' : 'bg-transparent'}`}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        checked={!!entry}
                        onChange={() => toggleWeekday(idx)}
                      />
                      <span className={`text-sm font-medium ${entry ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {label.substring(0, 3)}
                      </span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={entry?.start || "09:00"}
                        onChange={(e) => updateEntry(idx, "start", e.target.value)}
                        disabled={!entry}
                        className="text-xs border border-zinc-200 rounded-md p-1 disabled:opacity-30"
                      />
                      <span className="text-zinc-300">—</span>
                      <input
                        type="time"
                        value={entry?.end || "17:00"}
                        onChange={(e) => updateEntry(idx, "end", e.target.value)}
                        disabled={!entry}
                        className="text-xs border border-zinc-200 rounded-md p-1 disabled:opacity-30"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={saveWeekly}
              disabled={saving}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-xl font-semibold transition-all shadow-md shadow-blue-100"
            >
              {saving ? "Saving Changes..." : "Save Weekly Hours"}
            </button>
          </section>

          {/* Time Off / Exceptions Card */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div className="flex items-center gap-2 mb-6 text-zinc-900">
              <Calendar className="text-orange-500" size={20} />
              <h2 className="font-bold text-lg">Time Off Requests</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Date</label>
                <input 
                  type="date" 
                  value={exDate} 
                  onChange={(e) => setExDate(e.target.value)} 
                  className="w-full border border-zinc-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>
              
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                <button 
                  onClick={() => setExType("UNAVAILABLE")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${exType === 'UNAVAILABLE' ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Unavailable
                </button>
                <button 
                  onClick={() => setExType("AVAILABLE")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${exType === 'AVAILABLE' ? 'bg-white text-green-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Extra Availability
                </button>
              </div>

              <button 
                className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
                onClick={createException} 
                disabled={creatingEx}
              >
                <Plus size={16} />
                {creatingEx ? "Submitting..." : "Add Exception"}
              </button>
            </div>

            <div className="mt-8">
              <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3">Recent Requests</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {exceptions.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No exceptions listed.</p>
                ) : (
                  exceptions.map((ex: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl bg-zinc-50/50">
                      <div>
                        <p className="text-xs font-bold text-zinc-800">{new Date(ex.date).toLocaleDateString()}</p>
                        <p className={`text-[10px] uppercase font-black ${ex.isAvailable ? 'text-green-500' : 'text-orange-500'}`}>
                          {ex.isAvailable ? "Available" : "Time Off"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </aside>

        {/* RIGHT COLUMN: SHIFTS */}
        <main className="lg:col-span-8 space-y-8">
          {/* Assigned Shifts */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Coffee className="text-brown-500" size={24} />
              My Upcoming Shifts
            </h2>
            
            <div className="grid gap-4">
              {myShifts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl">
                  <p className="text-zinc-400">No shifts assigned this week.</p>
                </div>
              ) : (
                myShifts.map((shift: any) => (
                  <div key={shift._id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-zinc-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="space-y-1">
                      <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase mb-1">
                        {shift.location?.name}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900">{shift.title || "Standard Shift"}</h3>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={14} /> 
                          {new Date(shift.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-blue-600">
                          <Clock size={14} />
                          {new Date(shift.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</p>
                          <p className="text-sm font-bold text-green-600">{shift.status}</p>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Open Shifts Browser */}
          <section>
            <h3 className="text-lg font-bold text-zinc-800 mb-4 px-2">Published Openings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allShifts.map((shift: any) => (
                <div key={shift._id} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-100/30">
                  <p className="text-xs font-bold text-zinc-400 uppercase">{shift.location?.name}</p>
                  <h4 className="font-bold text-zinc-800 mb-2">{shift.title}</h4>
                  <p className="text-xs text-zinc-600 mb-1">
                    {new Date(shift.start).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-bold text-zinc-800">
                    {new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} start
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}