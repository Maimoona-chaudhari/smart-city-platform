import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "CITIZEN" | "OFFICER" | "DEPARTMENT_ADMIN" | "SUPER_ADMIN";
  department?: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["CITIZEN", "OFFICER", "DEPARTMENT_ADMIN", "SUPER_ADMIN"],
      default: "CITIZEN",
    },
    department: {
  type: Schema.Types.ObjectId,
  ref: "Department",
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;