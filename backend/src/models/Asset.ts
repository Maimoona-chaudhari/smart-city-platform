import mongoose, { Schema, Document } from "mongoose";

export interface IAsset extends Document {
  name: string;
  type: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: "ACTIVE" | "DAMAGED" | "UNDER_MAINTENANCE";
  department: mongoose.Types.ObjectId;
}

const assetSchema = new Schema<IAsset>(
  {
    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    description: String,

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

    status: {
      type: String,
      enum: ["ACTIVE", "DAMAGED", "UNDER_MAINTENANCE"],
      default: "ACTIVE",
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true }
);

const Asset = mongoose.model<IAsset>("Asset", assetSchema);

export default Asset;