import mongoose, { Schema } from "mongoose"

const SkillSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
  },
  { 
    collection: "skills" 
  }
)

export default mongoose.models.Skill || mongoose.model("Skill", SkillSchema)