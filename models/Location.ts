import mongoose, { Schema } from "mongoose"

const LocationSchema = new Schema(
  {
    name: { type: String, required: true },
    address: String,
    timezone: String,
    managers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { 
    timestamps: true,
    collection: "locations"
  }
)

export default mongoose.models.Location || mongoose.model("Location", LocationSchema)