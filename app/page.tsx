import Link from "next/link";
import { ChefHat, Users, CalendarCheck, LogIn, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg dark:bg-blue-500">
            <ChefHat size={48} />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Coastal Eats
          </h1>
          <p className="max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
            ShiftSync Workforce Management Portal. Schedule staff, manage availability, and ensure compliance across all locations.
          </p>
        </div>

        {/* Main Action Button */}
        <div className="w-full max-w-sm">
          <Link
            href="/auth/login"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-zinc-800 hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <LogIn className="h-5 w-5" />
            Sign In to Portal
          </Link>
          <p className="mt-4 text-sm text-zinc-500">
            Secure access for Admins, Managers & Staff
          </p>
        </div>

        {/* Quick Access Cards (For Dev/Demo Navigation) */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Admin Link */}
          <Link
            href="/manager" 
            className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-blue-500"
          >
            <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Admin & Manager</h3>
              <p className="text-sm text-zinc-500">Manage shifts & locations</p>
            </div>
          </Link>

          {/* Staff Link */}
          <Link
            href="/staff"
            className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-emerald-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-500"
          >
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CalendarCheck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Staff Portal</h3>
              <p className="text-sm text-zinc-500">View schedule & availability</p>
            </div>
          </Link>

          {/* Seed/Info Link (Optional - keeping it consistent with your user types) */}
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-6 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">4 Locations</h3>
              <p className="text-sm text-zinc-500">EST & PST Timezones</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}