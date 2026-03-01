import mongoose, { Schema } from "mongoose"
import "./Skill"
import "./Location"

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    name: String,
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "STAFF"],
      default: "STAFF",
    },
    skills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],
    certifications: [{ type: Schema.Types.ObjectId, ref: "Location" }],
  },
  { 
    timestamps: true,
    collection: "users" // Matches your Compass folder
  }
)

export default mongoose.models.User || mongoose.model("User", UserSchema)