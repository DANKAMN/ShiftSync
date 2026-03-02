import mongoose, { Schema } from "mongoose"

const SwapRequestSchema = new Schema(
  {
    shift: { type: Schema.Types.ObjectId, ref: "Shift", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // "DROP" or "SWAP"
    type: { type: String, enum: ["DROP", "SWAP"], required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
    },
    createdAt: { type: Date, default: () => new Date() },
    // For DROP requests we compute expiresAt = shift.start - 24h
    expiresAt: { type: Date, default: null },
    managerApproved: { type: Boolean, default: false },
    notes: { type: String, default: null },
  },
  { timestamps: true, collection: "swap_requests" }
)

// index for quick lookup of pending
SwapRequestSchema.index({ requester: 1, status: 1 })
SwapRequestSchema.index({ shift: 1, status: 1 })
SwapRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // **NOTE**: this will delete docs at expiry — we will not rely on it; leaving for audit cleanup is optional.

export default mongoose.models.SwapRequest || mongoose.model("SwapRequest", SwapRequestSchema)