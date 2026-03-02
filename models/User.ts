import mongoose, { Schema } from "mongoose"
import "./Skill"
import "./Location"

const UserSchema = new Schema(
  {
    email: { type: String, unique: true },
    name: String,
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "STAFF"],
      default: "STAFF",
    },
    skills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],
    certifications: [{ type: Schema.Types.ObjectId, ref: "Location" }],

    weeklyAvailability: [
      {
        weekday: { type: Number, required: true },
        start: String,
        end: String,
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model("User", UserSchema)