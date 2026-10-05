
import { Queue } from "bullmq";
import Redis from "ioredis";

export interface NotificationJobData {
  user: string;
  title: string;
  message: string;
  type: string;
}

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const notificationQueue = new Queue<NotificationJobData>(
  "notificationQueue",
  { connection }
);

export const addNotificationJob = async (
  data: NotificationJobData
) => {
  return notificationQueue.add("create-notification", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
};

export const addTestNotificationJob = async () => {
  await notificationQueue.add("test-notification", {
    user: "000000000000000000000000",
    title: "Test Notification",
    message: "BullMQ is working!",
    type: "TEST",
  });

  console.log("Test job added to queue");
};

console.log("Notification queue initialized");