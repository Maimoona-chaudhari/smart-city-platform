
import { Worker } from "bullmq";
import Redis from "ioredis";
import Notification from "../models/Notification";
import { NotificationJobData } from "../queues/notificationQueue";

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const notificationWorker = new Worker<NotificationJobData>(
  "notificationQueue",
  async (job) => {
    if (job.name === "create-notification") {
      await Notification.create({
        user: job.data.user,
        title: job.data.title,
        message: job.data.message,
        type: job.data.type,
      });

      console.log("Notification saved:", job.data.title);
    }
  },
  { connection }
);

notificationWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

export default notificationWorker;