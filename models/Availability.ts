import mongoose, { Schema } from "mongoose"

const AvailabilitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["WEEKLY", "EXCEPTION"],
      required: true,
    },

    // For WEEKLY
    dayOfWeek: {
      type: Number, // 0 = Sunday, 6 = Saturday
    },

    startTime: String, // "09:00"
    endTime: String,   // "17:00"

    // For EXCEPTION
    date: Date,

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Availability ||
  mongoose.model("Availability", AvailabilitySchema)