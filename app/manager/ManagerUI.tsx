"use client"

import { useState, useEffect } from "react"
import { createShift } from "./actions/createShift"
import { publishShift } from "./actions/publishShift"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Send, 
  LogOut,
  UserCheck
} from "lucide-react"

export default function ManagerUI({
  initialShifts,
  locations,
  staff,
  managerName,
  managerRole,
}: any) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [shifts, setShifts] = useState(initialShifts)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    locationId: "",
    title: "",
    start: "",
    end: "",
    headcount: 1,
    assignedStaffIds: [] as string[],
  })

  const handleCreate = async () => {
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
        alert(result.error)
        return
      }
      location.reload()
    } catch (err) {
      alert("An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (id: string) => {
    const result = await publishShift(id)
    if (!result.ok) return alert(result.error)
    location.reload()
  }

  if (!mounted) return <div className="p-8 text-center text-zinc-800 font-bold">Loading Dashboard...</div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-zinc-100 min-h-screen text-zinc-900">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-md border-b-4 border-indigo-600">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-800">
              {managerRole === "ADMIN" ? "Admin Command" : "Manager Hub"}
            </h1>
            <p className="text-sm font-bold text-indigo-600">Welcome back, {managerName || "Chief"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CREATE SHIFT FORM */}
        <aside className="lg:col-span-4">
          <section className="bg-purple-500 p-6 rounded-3xl shadow-xl text-white sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle size={24} />
              <h2 className="font-black text-xl uppercase">New Shift</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block opacity-80">Location</label>
                <select
                  className="w-full bg-white border-2 border-purple-700 rounded-xl p-3 text-sm font-bold text-zinc-900 focus:ring-4 focus:ring-purple-300 outline-none"
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  value={form.locationId}
                >
                  <option value="">Select Location...</option>
                  {locations.map((loc: any) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase mb-1 block opacity-80">Shift Title</label>
                <input
                  className="w-full bg-white border-2 border-purple-700 rounded-xl p-3 text-sm font-bold text-zinc-900 outline-none"
                  placeholder="e.g. Main Gate"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  value={form.title}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase mb-1 block opacity-80">Start</label>
                  <input
                    className="w-full bg-white border-2 border-purple-700 rounded-xl p-2 text-xs font-bold text-zinc-900 outline-none"
                    type="datetime-local"
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase mb-1 block opacity-80">End</label>
                  <input
                    className="w-full bg-white border-2 border-purple-700 rounded-xl p-2 text-xs font-bold text-zinc-900 outline-none"
                    type="datetime-local"
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase mb-1 block opacity-80">Required Headcount: {form.headcount}</label>
                <input
                  type="range" min="1" max="10"
                  className="w-full h-2 bg-purple-700 rounded-lg appearance-none cursor-pointer accent-white"
                  value={form.headcount}
                  onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase mb-2 block opacity-80 flex items-center gap-1">
                  <Users size={12} /> Assign Staff
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {staff.map((s: any) => (
                    <label key={s._id} className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all cursor-pointer ${form.assignedStaffIds.includes(s._id) ? 'bg-white text-purple-700 border-white' : 'bg-purple-600 border-purple-700 hover:bg-purple-550'}`}>
                      <span className="text-xs font-black">{s.name}</span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-none text-purple-600 focus:ring-0"
                        checked={form.assignedStaffIds.includes(s._id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...form.assignedStaffIds, s._id]
                            : form.assignedStaffIds.filter(id => id !== s._id)
                          setForm({ ...form, assignedStaffIds: ids })
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={handleCreate}
                className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg transition-all shadow-lg border-b-4 ${submitting ? "bg-zinc-400 border-zinc-500" : "bg-white text-purple-700 border-purple-200 hover:bg-zinc-100"}`}
              >
                {submitting ? "CREATING..." : "CREATE SHIFT"}
              </button>
            </div>
          </section>
        </aside>

        {/* SHIFT LIST */}
        <main className="lg:col-span-8 space-y-6">
          <h2 className="font-black text-2xl text-zinc-800 px-2 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Operational Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shifts.map((shift: any) => (
              <div
                key={shift._id}
                className={`rounded-[2rem] p-6 shadow-xl border-t-8 flex flex-col justify-between transition-transform hover:scale-[1.02] ${
                  shift.status === "DRAFT" ? "bg-amber-400 border-amber-500" : "bg-emerald-500 border-emerald-600"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black text-zinc-800 flex items-center gap-1">
                      <MapPin size={10} /> {shift.location?.name}
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 ${
                      shift.status === "DRAFT" ? "bg-amber-500 border-amber-600 text-white" : "bg-emerald-600 border-emerald-700 text-white"
                    }`}>
                      {shift.status}
                    </span>
                  </div>

                  <h3 className="font-black text-zinc-900 text-2xl leading-tight mb-2">
                    {shift.title || "Standard Shift"}
                  </h3>

                  <div className="flex flex-col gap-1 mb-4 text-zinc-900/80 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {new Date(shift.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs opacity-75">
                      {new Date(shift.start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* STAFF NAMES - REVEALED */}
                  <div className="bg-white/30 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase text-zinc-900">Personnel Assigned</span>
                      <span className="bg-white px-2 py-0.5 rounded-lg text-xs font-black text-zinc-800">
                        {shift.assignments?.length} / {shift.headcount}
                      </span>
                    </div>
                    
                    {shift.assignments?.length > 0 ? (
                      <ul className="space-y-1.5">
                        {shift.assignments.map((a: any) => (
                          <li key={a._id} className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                            {a.user?.name || "Anonymous Member"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-bold text-zinc-900/60 italic">No staff assigned yet.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {shift.status === "DRAFT" ? (
                    <button
                      onClick={() => handlePublish(shift._id)}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white text-sm font-black py-4 rounded-2xl shadow-lg transition-all"
                    >
                      <Send size={18} /> PUBLISH TO STAFF
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 bg-white/20 text-white py-4 rounded-2xl border-2 border-white/20 text-xs font-black uppercase tracking-widest">
                      <UserCheck size={18} /> Shift is Live
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}