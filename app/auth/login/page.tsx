"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (!res?.ok) {
      setError(res?.error || "Invalid credentials. Please try again.")
      setLoading(false)
      return
    }

    // fetch session to get role
    const sessionRes = await fetch("/api/auth/session")
    const session = await sessionRes.json()
    const role = session?.user?.role

    if (role === "MANAGER" || role === "ADMIN") {
      router.push("/manager")
    } else if (role === "STAFF") {
      router.push("/staff")
    } else {
      router.push("/")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100 font-sans">
      {/* Decorative background blobs to stop it from being "just white" */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/50 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200 mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Shift Command</h1>
          <p className="text-zinc-500 font-bold">Secure Access Portal</p>
        </div>

        <form 
          onSubmit={handle} 
          className="bg-white border-2 border-zinc-200 p-8 rounded-[2.5rem] shadow-2xl space-y-6"
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          {/* EMAIL INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="email"
                required
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-zinc-900 outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                placeholder="name@company.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-4 pl-12 pr-12 font-bold text-zinc-900 outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full group relative bg-zinc-900 hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-3 overflow-hidden"
          >
            <span className={`transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
              SIGN INTO DASHBOARD
            </span>
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>

          <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest pt-2">
            Authorized Personnel Only
          </p>
        </form>

        <footer className="mt-8 text-center text-zinc-400 text-xs font-bold">
          &copy; {new Date().getFullYear()} Operational Systems Inc.
        </footer>
      </div>
      
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}