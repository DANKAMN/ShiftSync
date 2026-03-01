import mongoose, { Schema } from "mongoose"
import "./Location"
import "./User"
import "./Skill"

const ShiftSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    title: String,
    start: Date,
    end: Date,
    requiredSkill: { type: Schema.Types.ObjectId, ref: "Skill" },
    headcount: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CANCELLED"],
      default: "DRAFT",
    },
    assignments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
          type: String,
          enum: ["ASSIGNED", "CONFIRMED", "CHECKED_IN", "CANCELLED"],
          default: "ASSIGNED",
        },
      },
    ],
  },
  { 
    timestamps: true,
    collection: "shifts" // Matches your Compass folder
  }
)

export default mongoose.models.Shift || mongoose.model("Shift", ShiftSchema)