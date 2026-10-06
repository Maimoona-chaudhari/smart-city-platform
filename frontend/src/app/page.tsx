"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus,
  FileText,
  Inbox,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { SlaTimer } from "../components/SlaTimer";

/* ---------- Shared UI helpers ---------- */

type Tone = "gray" | "blue" | "indigo" | "green" | "amber" | "orange" | "red";

const badgeTone: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

const barTone: Record<Tone, string> = {
  gray: "bg-slate-400",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const iconTone: Record<"indigo" | "amber" | "red" | "green" | "slate", string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  green: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
};

const pretty = (value?: string) =>
  value ? value.replace(/_/g, " ") : "Unknown";

const statusTone = (status?: string): Tone => {
  switch (status) {
    case "ASSIGNED":
      return "blue";
    case "IN_PROGRESS":
      return "indigo";
    case "RESOLVED":
      return "green";
    default:
      return "gray";
  }
};

const priorityTone = (priority?: string): Tone => {
  switch (priority) {
    case "CRITICAL":
      return "red";
    case "HIGH":
      return "orange";
    case "MEDIUM":
      return "amber";
    default:
      return "gray";
  }
};

const getSlaState = (complaint: any) => {
  if (!complaint.slaDeadline) return "UNKNOWN";

  const deadline = new Date(complaint.slaDeadline).getTime();
  if (Number.isNaN(deadline)) return "UNKNOWN";

  if (complaint.resolvedAt) {
    const resolvedAt = new Date(complaint.resolvedAt).getTime();
    if (Number.isNaN(resolvedAt)) return "UNKNOWN";

    return resolvedAt <= deadline ? "RESOLVED_ON_TIME" : "RESOLVED_LATE";
  }

  if (["RESOLVED", "CLOSED"].includes(complaint.status)) {
    return "UNVERIFIED";
  }

  return Date.now() > deadline ? "OVERDUE" : "WITHIN_SLA";
};

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeTone[tone]}`}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  icon: Icon,
  title,
  value,
  hint,
  color,
}: {
  icon: LucideIcon;
  title: string;
  value: number;
  hint?: string;
  color: keyof typeof iconTone;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[color]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-sm font-medium leading-tight text-slate-500">
          {title}
        </h3>
      </div>

      <div className="mt-auto pt-4">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}

function BarList({
  items,
  emptyText,
}: {
  items: { label: string; value: number; tone: Tone }[];
  emptyText: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${barTone[item.tone]}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  text,
  primary,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  text: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        primary
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          primary ? "bg-white/15 text-white" : "bg-indigo-50 text-indigo-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span
          className={`block text-xs ${primary ? "text-indigo-100" : "text-slate-500"}`}
        >
          {text}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
    </a>
  );
}

function PageHeader({ title, text }: { title: string; text: string }) {
  return (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-slate-500 sm:text-base">{text}</p>
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const countBy = (items: any[], key: string, toneFor: (v?: string) => Tone) => {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const value = item?.[key] ?? "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      label: pretty(value),
      value: count,
      tone: toneFor(value),
    }));
};

/* ---------- Page ---------- */

export default function Home() {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [departmentComplaints, setDepartmentComplaints] = useState<any[]>([]);
  const [myId, setMyId] = useState("");
  const [data, setData] = useState<{
    complaints: any[];
    emergencies: unknown[];
    assets: unknown[];
    departments: unknown[];
  }>({
    complaints: [],
    emergencies: [],
    assets: [],
    departments: [],
  });

  const departmentPerformance = (data.departments as any[]).map((dept) => {
    const complaints = data.complaints.filter((c) => {
      const departmentId =
        typeof c.department === "object"
          ? c.department?._id
          : c.department;

      return departmentId?.toString() === dept._id?.toString();
    });

      const departmentSlaViolations = complaints.filter((complaint) =>
        ["RESOLVED_LATE", "OVERDUE"].includes(getSlaState(complaint))
      ).length;

    return {
      name: dept.name,
      total: complaints.length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
      pending: complaints.filter(
        (c) => !["RESOLVED", "CLOSED"].includes(c.status)
      ).length,
      slaViolations: departmentSlaViolations,
    };
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:5000/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(async (profile) => {
        console.log("PROFILE USER:", profile);
        setRole(profile.user.role);
        setName(profile.user.name);
        setMyId(profile.user.id || profile.user._id || "");

        if (profile.user.role === "SUPER_ADMIN") {
          const headers = {
            Authorization: `Bearer ${token}`,
          };

          const [cRes, eRes, aRes, dRes] = await Promise.all([
            fetch("http://localhost:5000/api/complaints/all", { headers }),
            fetch("http://localhost:5000/api/emergencies", { headers }),
            fetch("http://localhost:5000/api/assets", { headers }),
            fetch("http://localhost:5000/api/departments", { headers }),
          ]);

          const [c, e, a, d] = await Promise.all([
            cRes.json(),
            eRes.json(),
            aRes.json(),
            dRes.json(),
          ]);

          console.log("Admin API results:", { c, e, a, d });

          const getArray = (result: any, key: string): any[] =>
            Array.isArray(result)
              ? result
              : Array.isArray(result?.[key])
                ? result[key]
                : [];

          setData({
            complaints: getArray(c, "complaints"),
            emergencies: getArray(e, "emergencies"),
            assets: getArray(a, "assets"),
            departments: getArray(d, "departments"),
          });
        }
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:5000/api/complaints/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        setMyComplaints(result.complaints || []);
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:5000/api/notifications", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        setNotifications(Array.isArray(result) ? result : []);
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:5000/api/complaints/department", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        setDepartmentComplaints(result.complaints || []);
      })
      .catch((error) => console.error(error));

  }, []);

  /* ----- CITIZEN ----- */
  if (role === "CITIZEN") {
    const recent = myComplaints.slice(0, 5);
        const submittedCount = myComplaints.filter(
      (c) => c.status === "SUBMITTED"
    ).length;
    const inProgressCount = myComplaints.filter((c) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(c.status)
    ).length;
    const resolvedCount = myComplaints.filter((c) =>
      ["RESOLVED", "CLOSED"].includes(c.status)
    ).length;
    const statusCounts = {
      submitted: myComplaints.filter((c) => c.status === "SUBMITTED").length,
      assigned: myComplaints.filter((c) => c.status === "ASSIGNED").length,
      inProgress: myComplaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: myComplaints.filter((c) => c.status === "RESOLVED").length,
      closed: myComplaints.filter((c) => c.status === "CLOSED").length,
    };

    return (
      <div className="space-y-6">
        <PageHeader
          title={`${greeting()}, ${name}`}
          text="Manage your complaints and stay updated."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            icon={FileText}
            title="My Complaints"
            value={myComplaints.length}
            hint="Complaints you have submitted"
            color="indigo"
          />
          <KpiCard
            icon={Bell}
            title="Notifications"
            value={notifications.length}
            hint="Updates on your complaints"
            color="amber"
          />
        </div>

         {/* Complaint Status Overview */}
        <Panel title="Complaint Status" description="Track the progress of your complaints">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Submitted", value: statusCounts.submitted, color: "text-blue-700 bg-blue-50" },
              { label: "Assigned", value: statusCounts.assigned, color: "text-indigo-700 bg-indigo-50" },
              { label: "In Progress", value: statusCounts.inProgress, color: "text-amber-700 bg-amber-50" },
              { label: "Resolved", value: statusCounts.resolved, color: "text-emerald-700 bg-emerald-50" },
              { label: "Closed", value: statusCounts.closed, color: "text-slate-700 bg-slate-100" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-4 ${item.color}`}
              >
                <p className="text-xs font-medium">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            icon={Inbox}
            title="Submitted"
            value={submittedCount}
            hint="Waiting to be assigned"
            color="slate"
          />
          <KpiCard
            icon={Activity}
            title="In Progress"
            value={inProgressCount}
            hint="Assigned or being worked on"
            color="amber"
          />
          <KpiCard
            icon={CheckCircle2}
            title="Resolved"
            value={resolvedCount}
            hint="Resolved or closed"
            color="green"
          />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick actions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              href="/complaints/submit"
              icon={FilePlus}
              title="Submit Complaint"
              text="Report a new issue"
              primary
            />
            <ActionCard
              href="/complaints"
              icon={ClipboardList}
              title="My Complaints"
              text="Track your submissions"
            />
            <ActionCard
              href="/notifications"
              icon={Bell}
              title="Notifications"
              text="See latest updates"
            />
          </div>
        </div>

        <Panel title="Recent Complaints" description="Your latest submissions">
          {recent.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No complaints yet"
              text="Complaints you submit will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((complaint) => (
                <li
                  key={complaint._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {complaint.title}
                    </p>
                    {complaint.createdAt && (
                      <p className="text-xs text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge tone={statusTone(complaint.status)}>
                    {pretty(complaint.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    );
  }

  /* ----- SUPER_ADMIN ----- */
  if (role === "SUPER_ADMIN") {
    const slaCounts = {
      resolvedOnTime: data.complaints.filter(
        (c) => getSlaState(c) === "RESOLVED_ON_TIME"
      ).length,
      resolvedLate: data.complaints.filter(
        (c) => getSlaState(c) === "RESOLVED_LATE"
      ).length,
      overdue: data.complaints.filter(
        (c) => getSlaState(c) === "OVERDUE"
      ).length,
      withinSla: data.complaints.filter(
        (c) => getSlaState(c) === "WITHIN_SLA"
      ).length,
      unverified: data.complaints.filter(
        (c) => getSlaState(c) === "UNVERIFIED"
      ).length,
    };

    const slaViolatedComplaints = data.complaints.filter((c) =>
      ["RESOLVED_LATE", "OVERDUE"].includes(getSlaState(c))
    );

    const slaViolations = slaCounts.resolvedLate + slaCounts.overdue;
    const totalComplaints = data.complaints.length;
    const resolvedCount = data.complaints.filter(
      (c) => c.status === "RESOLVED"
    ).length;
    const openCount = data.complaints.filter(
      (c) => !["RESOLVED", "CLOSED"].includes(c.status)
    ).length;
    const slaShare = totalComplaints
      ? Math.round((slaViolations / totalComplaints) * 100)
      : 0;
    const resolvedWithDeadline = data.complaints.filter(
      (c) =>
        ["RESOLVED", "CLOSED"].includes(c.status) &&
        c.resolvedAt &&
        c.slaDeadline
    );
    const resolvedOnTime = resolvedWithDeadline.filter(
      (c) =>
        new Date(c.resolvedAt).getTime() <= new Date(c.slaDeadline).getTime()
    ).length;
    const slaCompliance = resolvedWithDeadline.length
      ? Math.round((resolvedOnTime / resolvedWithDeadline.length) * 100)
      : null;
    const overdueRate = totalComplaints
      ? Math.round((slaViolations / totalComplaints) * 100)
      : 0;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Smart City Operations Dashboard"
          text="Monitor city operations from one place."
        />

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            icon={FileText}
            title="Complaints"
            value={totalComplaints}
            hint={`${resolvedCount} resolved · ${openCount} open`}
            color="indigo"
          />
          <KpiCard
            icon={AlertTriangle}
            title="Emergencies"
            value={data.emergencies.length}
            hint="Total recorded"
            color="amber"
          />
          <KpiCard
            icon={Landmark}
            title="Public Assets"
            value={data.assets.length}
            hint="Total registered"
            color="slate"
          />
          <KpiCard
            icon={ShieldAlert}
            title="SLA Violations"
            value={slaViolations}
            hint={`${slaShare}% of all complaints`}
            color="red"
          />
          <KpiCard
            icon={Building2}
            title="Departments"
            value={data.departments.length}
            hint="Total registered"
            color="green"
          />
        </div>
                <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "SLA Compliance",
              value: slaCompliance === null ? "—" : `${slaCompliance}%`,
              hint: `${resolvedOnTime} of ${resolvedWithDeadline.length} resolved complaints met their deadline`,
              icon: ShieldCheck,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Overdue Rate",
              value: `${overdueRate}%`,
              hint: `${slaViolations} of ${totalComplaints} complaints violated their SLA`,
              icon: ShieldAlert,
              iconClass: "bg-red-50 text-red-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-medium text-slate-500">
                    {item.label}
                  </h3>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </div>
            );
          })}
        </div>

        {/* Operational overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Complaints by Status" description="Current distribution">
            <BarList
              items={countBy(data.complaints, "status", statusTone)}
              emptyText="No complaint data available."
            />
          </Panel>

          <Panel title="Complaints by Priority" description="Current distribution">
            <BarList
              items={countBy(data.complaints, "priority", priorityTone)}
              emptyText="No complaint data available."
            />
          </Panel>

          <Panel title="SLA Violations by Department" description="Where delays occur">
            <BarList
              items={departmentPerformance
                .filter((d) => d.slaViolations > 0)
                .sort((a, b) => b.slaViolations - a.slaViolations)
                .map((d) => ({
                  label: d.name,
                  value: d.slaViolations,
                  tone: "red" as Tone,
                }))}
              emptyText="No SLA violations by department."
            />
          </Panel>
        </div>

        {/* SLA Monitoring */}
        <Panel
          title="SLA Monitoring"
          description="Track complaint deadlines and resolution performance"
        >
          {/* SLA Summary */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: "Resolved on Time",
                value: slaCounts.resolvedOnTime,
                color: "border-emerald-200 bg-emerald-50 text-emerald-700",
              },
              {
                label: "Resolved Late",
                value: slaCounts.resolvedLate,
                color: "border-red-200 bg-red-50 text-red-700",
              },
              {
                label: "Overdue",
                value: slaCounts.overdue,
                color: "border-amber-200 bg-amber-50 text-amber-700",
              },
              {
                label: "Within SLA",
                value: slaCounts.withinSla,
                color: "border-blue-200 bg-blue-50 text-blue-700",
              },
              {
                label: "Unverified",
                value: slaCounts.unverified,
                color: "border-slate-200 bg-slate-50 text-slate-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 ${item.color}`}
              >
                <p className="text-xs font-medium">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Violated Complaints */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Late and Overdue Complaints
            </h3>

            {slaViolatedComplaints.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No verified SLA violations"
                text="There are currently no complaints confirmed as resolved late or overdue."
              />
            ) : (
              <ul className="space-y-3">
                {slaViolatedComplaints.map((complaint) => {
                  const slaState = getSlaState(complaint);
                  const isLate = slaState === "RESOLVED_LATE";

                  return (
                    <li
                      key={complaint._id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 ${
                        isLate ? "border-l-red-500" : "border-l-amber-500"
                      } bg-white p-4`}
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {complaint.title}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          Deadline:{" "}
                          {new Date(
                            complaint.slaDeadline
                          ).toLocaleString()}
                        </p>

                        {isLate && complaint.resolvedAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            Resolved:{" "}
                            {new Date(
                              complaint.resolvedAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={priorityTone(complaint.priority)}>
                          {pretty(complaint.priority)}
                        </Badge>
                        <Badge tone={statusTone(complaint.status)}>
                          {pretty(complaint.status)}
                        </Badge>
                        <Badge tone={isLate ? "red" : "amber"}>
                          {isLate ? "Resolved Late" : "Overdue"}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>

        {/* Department Performance */}
        <Panel
          title="Department Performance"
          description="Complaint handling by department"
        >
          {departmentPerformance.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No department data"
              text="Department statistics will appear once departments are available."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Resolved</th>
                    <th className="px-4 py-3 font-medium">Pending</th>
                    <th className="px-4 py-3 font-medium">SLA Violations</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {departmentPerformance.map((dept) => (
                    <tr key={dept.name} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{dept.total}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone={dept.resolved > 0 ? "green" : "gray"}>
                          {dept.resolved}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={dept.pending > 0 ? "amber" : "gray"}>
                          {dept.pending}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={dept.slaViolations > 0 ? "red" : "gray"}>
                          {dept.slaViolations}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  /* ----- OFFICER ----- */
  if (role === "OFFICER") {
    console.log("MY ID:", myId);
    console.log(
      "DEPT COMPLAINTS:",
      departmentComplaints.map((c) => ({
        title: c.title,
        officer: c.assignedOfficer,
      }))
    );

    const assignedComplaints = departmentComplaints.filter(
      (c) => myId && c.assignedOfficer?._id?.toString() === myId.toString()
    );

    const inProgress = departmentComplaints.filter(
      (complaint) => complaint.status === "IN_PROGRESS"
    ).length;

    const resolved = departmentComplaints.filter(
      (complaint) => complaint.status === "RESOLVED"
    ).length;

    const total = departmentComplaints.length;
    const remaining = Math.max(total - inProgress - resolved, 0);
    const pct = (n: number) => (total ? (n / total) * 100 : 0);

    const urgentWork = assignedComplaints
      .filter((c) => !["RESOLVED", "CLOSED"].includes(c.status))
      .sort(
        (a, b) =>
          new Date(a.slaDeadline || "9999-12-31").getTime() -
          new Date(b.slaDeadline || "9999-12-31").getTime()
      )
      .slice(0, 5);

    const overdueCount = assignedComplaints.filter(
      (c) => getSlaState(c) === "OVERDUE"
    ).length;

    return (
      <div className="space-y-6">
        <PageHeader
          title={`${greeting()}, ${name}`}
          text="Manage complaints assigned to your department."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={ClipboardList}
            title="Department Complaints"
            value={total}
            hint="All complaints in your department"
            color="indigo"
          />
          <KpiCard
            icon={UserCheck}
            title="Assigned to Me"
            value={assignedComplaints.length}
            hint="Your personal workload"
            color="slate"
          />
          <KpiCard
            icon={Activity}
            title="In Progress"
            value={inProgress}
            hint="Currently being handled"
            color="amber"
          />
          <KpiCard
            icon={CheckCircle2}
            title="Resolved"
            value={resolved}
            hint="Completed complaints"
            color="green"
          />
        </div>

        <Panel
          title="Work Overview"
          description="Status of your department's complaints"
        >
          {total === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No department complaints"
              text="Complaints for your department will appear here."
            />
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-indigo-500" style={{ width: `${pct(inProgress)}%` }} />
                <div className="bg-emerald-500" style={{ width: `${pct(resolved)}%` }} />
                <div className="bg-slate-300" style={{ width: `${pct(remaining)}%` }} />
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  In Progress ({inProgress})
                </span>
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Resolved ({resolved})
                </span>
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Other ({remaining})
                </span>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Urgent Work"
          description={
            overdueCount > 0
              ? `${overdueCount} overdue · closest deadlines first`
              : "Closest deadlines first"
          }
        >
          {urgentWork.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending work"
              text="Complaints assigned to you will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {urgentWork.map((complaint) => (
                <li
                  key={complaint._id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <a
                      href={`/complaints/${complaint._id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {complaint.title}
                    </a>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone={priorityTone(complaint.priority)}>
                        {pretty(complaint.priority)}
                      </Badge>
                      <Badge tone={statusTone(complaint.status)}>
                        {pretty(complaint.status)}
                      </Badge>
                    </div>
                  </div>

                  <SlaTimer
                    createdAt={complaint.createdAt}
                    deadline={complaint.slaDeadline}
                    status={complaint.status}
                    resolvedAt={complaint.resolvedAt}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ActionCard
              href="/complaints"
              icon={ClipboardList}
              title="View Department Complaints"
              text="Review and update complaints"
              primary
            />
            <ActionCard
              href="/notifications"
              icon={Bell}
              title="Notifications"
              text="See latest updates"
            />
          </div>
        </div>
      </div>
    );
  }

  return <DashboardSkeleton />;
}