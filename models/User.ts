import mongoose, { Schema, Document, Model } from "mongoose"
import bcrypt from "bcrypt"

import "./Skill"
import "./Location"

// 1. Define the document interface
interface IUser extends Document {
  email: string;
  password?: string;
  role: string;
  isModified(path: string): boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    name: String,
    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "STAFF"],
      default: "STAFF",
    },
    password: { type: String },
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

/**
 * Hash password before save
 * Removing the 'next' parameter and using async/await return flow
 */
UserSchema.pre<IUser>("save", async function () {
  // If password isn't modified or doesn't exist, just exit (resolves the promise)
  if (!this.isModified("password") || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    // Throwing an error in an async hook is the same as calling next(err)
    throw err;
  }
});

/**
 * Compare helper
 * Casting 'this' to any or IUser to access password
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  const user = this as IUser;
  if (!user.password) return false;
  return bcrypt.compare(candidatePassword, user.password);
}

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)