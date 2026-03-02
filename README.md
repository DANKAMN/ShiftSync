This README is designed to be the "source of truth" for **ShiftSync**. It highlights the sophisticated business logic you've built—specifically the labor law compliance and the "Coastal Eats" multi-location architecture.

---

# 🌊 ShiftSync: Coastal Eats Edition

### **Intelligent Workforce Scheduling & Labor Compliance**

ShiftSync is a full-stack workforce management platform built for **Coastal Eats**, a restaurant group operating across multiple locations and time zones. The system moves beyond simple scheduling by enforcing real-world labor laws, skill-based assignments, and complex availability logic.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Database:** MongoDB via Mongoose
* **Authentication:** NextAuth.js (JWT Strategy)
* **Styling:** Tailwind CSS 4
* **Time Handling:** date-fns & date-fns-tz (Timezone-aware scheduling)

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js (v18 or higher recommended)
* A MongoDB Atlas cluster (or local instance)

### 2. Installation

```bash
git clone <your-repo-url>
cd shiftsync
npm install

```

### 3. Environment Setup

Create a `.env` file in the root directory and add your credentials:

```env
MONGODB_URI="your_mongodb_connection_string"
NEXTAUTH_SECRET="your_random_secret_string"
NEXTAUTH_URL="http://localhost:3000"

```

### 4. Database Seeding

This project includes a comprehensive seed script that sets up the "Coastal Eats" environment, including skills (Bartender, Line Cook, etc.), 4 locations across EST/PST, and test users for all roles.

```bash
npm run seed

```

### 5. Start Development

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view the app.

---

## 🔐 Role-Based Access Control (RBAC)

ShiftSync uses a tiered permission system to ensure data security and operational focus:

| Feature | Admin | Manager | Staff |
| --- | --- | --- | --- |
| View Global Dashboard | ✅ | ❌ | ❌ |
| Manage Multiple Locations | ✅ | ✅ (Assigned only) | ❌ |
| Create/Publish Shifts | ✅ | ✅ | ❌ |
| Override Labor Warnings | ✅ | ✅ | ❌ |
| Set Personal Availability | ❌ | ❌ | ✅ |
| View Personal Schedule | ❌ | ❌ | ✅ |

**Navigation Links:**

* **Login:** `/auth/login`
* **Manager/Admin Dashboard:** `/manager`
* **Staff Portal:** `/staff`

---

## 🧠 Business Logic & Constraints

The core of ShiftSync is its **Hardened Scheduling Engine**. The system prevents human error by enforcing the following rules:

### 1. The "Smart Assignment" Engine

Before a shift is created or assigned, the system validates:

* **Double-Booking:** Prevents overlapping shifts for the same person across *all* locations.
* **Rest Rule:** Enforces a mandatory **10-hour gap** between the end of one shift and the start of the next.
* **Skill Match:** Staff can only be assigned to roles they are skilled in (e.g., a "Server" cannot be assigned a "Line Cook" shift).
* **Certification:** Staff must be certified for the specific location they are being assigned to.
* **Availability:** Checks against the staff's recurring weekly windows and one-off "Exceptions" (Time-off requests).

### 2. Labor Law & Overtime Compliance

The system tracks hours in real-time to prevent fatigue and budget overruns:

* **Weekly Limits:** * **35+ hours:** Visual warning on the dashboard.
* **40+ hours:** High-priority overtime alert.


* **Daily Limits:** * **8+ hours:** Warning.
* **12+ hours:** Hard block (Cannot assign).


* **Consecutive Days:** * **6th Day:** Warning.
* **7th Day:** Requires a manager override and a documented reason.



### 3. Timezone & Overnight Logic

* **Timezone Aware:** Shifts are stored in UTC but displayed in the **Location's local timezone** (e.g., a NYC manager sees 5 PM EST, while a Seattle manager sees 2 PM PST for the same moment).
* **Overnight Handling:** Shifts crossing midnight (e.g., 11 PM – 3 AM) are treated as a single continuous block for rest-rule and daily hour calculations.

---

## 📂 Project Structure

* `/app`: Next.js App Router (Routes and Server Components)
* `/models`: Mongoose Schemas (User, Shift, Location, Skill, Availability)
* `/scripts`: Database seeding logic
* `/lib`: MongoDB connection and shared utility functions
* `/actions`: Server Actions for creating/publishing shifts

---

## 🛠 Troubleshooting

* **Seed Error:** Ensure your MongoDB URI is correct and your IP is whitelisted in Atlas.
* **Auth Error:** If login fails after seeding, remember the default password for all seed users is `password123`.
* **Type Errors:** If `session.user.id` shows an error, ensure the `next-auth.d.ts` file is present in your root to extend the User type.

---

**Would you like me to add a "Testing Scenarios" section to the README so you can prove to your boss that the 10-hour rest rule and overtime blocks actually work?**