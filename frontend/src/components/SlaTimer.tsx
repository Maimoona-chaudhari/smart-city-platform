"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

type SlaTimerProps = {
  createdAt?: string;
  deadline?: string;
  status?: string;
  resolvedAt?: string | null;
};

const formatDuration = (ms: number) => {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000);

  if (totalMinutes < 1) return "<1m";

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function SlaTimer({
  createdAt,
  deadline,
  status,
  resolvedAt,
}: SlaTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  // Refresh the countdown every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!deadline) {
    return <span className="text-xs text-slate-400">No SLA</span>;
  }

  const deadlineMs = new Date(deadline).getTime();
  const done = status === "RESOLVED" || status === "CLOSED";

  // Finished: the timer stops and shows the result
  if (done) {
    if (!resolvedAt) {
      return (
        <span className="text-xs text-slate-500">
          {status === "CLOSED" ? "Closed" : "Resolved"}
        </span>
      );
    }

    const resolvedMs = new Date(resolvedAt).getTime();
    const startMs = createdAt ? new Date(createdAt).getTime() : null;
    const late = resolvedMs > deadlineMs;

    return (
      <div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            late ? "text-red-600" : "text-emerald-600"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {late
            ? `Resolved ${formatDuration(resolvedMs - deadlineMs)} late`
            : "Resolved on time"}
        </span>
        {startMs && (
          <span className="block text-[11px] text-slate-500">
            in {formatDuration(resolvedMs - startMs)}
          </span>
        )}
      </div>
    );
  }

  // Running: countdown with colour zones
  const remaining = deadlineMs - now;
  const total = createdAt ? deadlineMs - new Date(createdAt).getTime() : 0;
  const overdue = remaining <= 0;

  const used = overdue
    ? 1
    : total > 0
    ? Math.min(Math.max(1 - remaining / total, 0), 1)
    : 0;

  const textColor = overdue
    ? "text-red-700"
    : used >= 0.8
    ? "text-red-600"
    : used >= 0.5
    ? "text-amber-600"
    : "text-emerald-600";

  const barColor = overdue
    ? "bg-red-700"
    : used >= 0.8
    ? "bg-red-500"
    : used >= 0.5
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="min-w-[130px]">
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${textColor}`}
      >
        <Clock className="h-3.5 w-3.5" />
        {overdue
          ? `Overdue by ${formatDuration(-remaining)}`
          : `${formatDuration(remaining)} left`}
      </span>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${used * 100}%` }}
        />
      </div>
    </div>
  );
}
