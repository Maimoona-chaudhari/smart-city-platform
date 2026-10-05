import mongoose, { Document, Schema } from "mongoose";

export interface IComplaintAttachment {
  url: string;
  publicId: string;
  name: string;
  type: string;
}

export interface IComplaint extends Document {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  citizen: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  assignedOfficer?: mongoose.Types.ObjectId;
  slaDeadline?: Date;
  slaViolated?: boolean;
  resolvedAt?: Date;

  location: {
    latitude: number;
    longitude: number;
  };

  workflow?: mongoose.Types.ObjectId;
  currentWorkflowStep?: number;

  attachments?: IComplaintAttachment[];
}

const attachmentSchema = new Schema<IComplaintAttachment>(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const complaintSchema = new Schema<IComplaint>(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
      ],
      default: "SUBMITTED",
    },

    citizen: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },

    assignedOfficer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    slaDeadline: {
      type: Date,
    },
    slaViolated: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    workflow: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
    },

    currentWorkflowStep: {
      type: Number,
      default: 1,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);

const Complaint = mongoose.model<IComplaint>(
  "Complaint",
  complaintSchema
);

export default Complaint;