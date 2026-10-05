import mongoose, { Document, Schema } from "mongoose";

export interface IWorkflowStep {
  name: string;
  description?: string;
  order: number;
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  department?: mongoose.Types.ObjectId;
  steps: IWorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workflowStepSchema = new Schema<IWorkflowStep>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const workflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },

    steps: {
      type: [workflowStepSchema],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Workflow = mongoose.model<IWorkflow>(
  "Workflow",
  workflowSchema
);

export default Workflow;