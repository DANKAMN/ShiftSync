"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    setLoading(false)

    if (res?.ok) {
      // get redirect target from URL
      router.push("/manager") // or redirect to saved "from" param
    } else {
      alert("Login failed: " + (res?.error || "Invalid credentials"))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handle} className="w-full max-w-md border p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>

        <label className="block mb-2">Email</label>
        <input className="w-full mb-3 p-2 border" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="block mb-2">Password</label>
        <input type="password" className="w-full mb-4 p-2 border" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}