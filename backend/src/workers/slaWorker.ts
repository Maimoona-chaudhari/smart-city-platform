import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import Complaint from "../models/Complaint";
import { addNotificationJob } from "../queues/notificationQueue";

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  { maxRetriesPerRequest: null }
);

const slaWorker = new Worker(
  "slaQueue",
  async () => {
    const overdueComplaints = await Complaint.find({
      slaDeadline: { $lt: new Date() },
      slaViolated: { $ne: true },
      status: { $nin: ["RESOLVED", "CLOSED"] },
    });

    for (const complaint of overdueComplaints) {
      const result = await Complaint.updateOne(
        {
          _id: complaint._id,
          slaViolated: { $ne: true },
          status: { $nin: ["RESOLVED", "CLOSED"] },
        },
        { $set: { slaViolated: true } }
      );

      if (result.modifiedCount > 0) {
        await addNotificationJob({
          user: complaint.citizen.toString(),
          title: "SLA Deadline Exceeded",
          message: `Your complaint "${complaint.title}" has exceeded its SLA deadline.`,
          type: "COMPLAINT_STATUS",
        });

        console.log("SLA violated:", complaint.title);
      }
    }
  },
  { connection }
);

slaWorker.on("completed", (job) =>
  console.log(`SLA check completed: ${job.id}`)
);

slaWorker.on("failed", (job, error) =>
  console.error(`SLA job failed: ${job?.id}`, error.message)
);

export default slaWorker;