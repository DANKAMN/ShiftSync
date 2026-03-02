import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/lib/mongodb"
import Shift from "@/models/Shift"
import Availability from "@/models/Availability"
import User from "@/models/User"
import StaffUI from "./StaffUI"

export default async function StaffPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Let middleware handle redirects; return empty if no session
    return <div className="p-6">Please sign in.</div>
  }

  await connectDB()

  const userId = session.user.id

  // My assigned shifts (published and drafts too for visibility)
  const myShifts = await Shift.find({
    "assignments.user": userId,
  })
    .populate("location")
    .populate("assignments.user")
    .sort({ start: 1 })
    .lean()

  // All published shifts (for pickup / browse)
  const allPublished = await Shift.find({ status: "PUBLISHED" })
    .populate("location")
    .populate("assignments.user")
    .sort({ start: 1 })
    .lean()

  // User weeklyAvailability (from user doc) + Availability exceptions
  const user = await User.findById(userId).lean()
  const exceptions = await Availability.find({
    user: userId,
    type: "EXCEPTION",
  })
    .sort({ date: 1 })
    .lean()

  return (
    <StaffUI
      initialMyShifts={JSON.parse(JSON.stringify(myShifts))}
      initialAllShifts={JSON.parse(JSON.stringify(allPublished))}
      initialWeeklyAvailability={user?.weeklyAvailability || []}
      initialExceptions={JSON.parse(JSON.stringify(exceptions))}
      user={JSON.parse(JSON.stringify({ id: userId, name: session.user.name, email: session.user.email }))}
    />
  )
}