import "dotenv/config";
import "./config/redis";
import dns from "dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/authRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import assetRoutes from "./routes/assetRoutes";
import emergencyRoutes from "./routes/emergencyRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import gisRoutes from "./routes/gisRoutes";
import { slaQueue } from "./queues/slaQueue";
import "./workers/notificationWorker";
import "./workers/slaWorker";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Use Google DNS
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"], // dev frontend origin(s), array mein aur bhi daal sakte hain
    credentials: true, // cookies/auth headers allow karne ke liye
  })
);
app.use(express.json());
app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/gis", gisRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "Smart City Platform API is running 🚀"
  });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  await connectDatabase();

  await slaQueue.upsertJobScheduler(
    "sla-monitor-every-minute",
    { every: 60_000 },
    {
      name: "check-overdue-complaints",
      data: {},
      opts: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }
  );
app.listen(PORT, "0.0.0.0", () => {
  
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("SLA monitoring scheduled every minute");
  });
};

startServer();