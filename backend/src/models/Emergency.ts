import mongoose, { Schema, Document } from "mongoose";

export interface IEmergency extends Document {
  title: string;
  description: string;
  type: string;
  priority: "HIGH" | "CRITICAL";
  status: "REPORTED" | "DISPATCHED" | "IN_PROGRESS" | "RESOLVED";
  reportedBy: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  assignedOfficer?: mongoose.Types.ObjectId;
  dispatchedAt?: Date;
  resolvedAt?: Date;
  location: {
    latitude: number;
    longitude: number;
  };
}

const emergencySchema = new Schema<IEmergency>(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["HIGH", "CRITICAL"],
      default: "HIGH",
    },

    status: {
      type: String,
      enum: ["REPORTED", "DISPATCHED", "IN_PROGRESS", "RESOLVED"],
      default: "REPORTED",
    },

    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Set when an admin dispatches the emergency
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },

    assignedOfficer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    dispatchedAt: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Emergency = mongoose.model<IEmergency>(
  "Emergency",
  emergencySchema
);

export default Emergency;