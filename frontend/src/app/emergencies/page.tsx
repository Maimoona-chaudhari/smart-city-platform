"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Plus,
  Send,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  PageSkeleton,
  priorityTone,
  pretty,
  type Tone,
} from "../../components/ui";

type Emergency = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  createdAt?: string;
  resolvedAt?: string;
  reportedBy?: { _id: string; name: string; email: string; role?: string };
  department?: { _id: string; name: string; code?: string };
  assignedOfficer?: { _id: string; name: string; email: string };
  location?: { latitude: number; longitude: number };
};

const emergencyStatusTone = (status?: string): Tone => {
  switch (status) {
    case "REPORTED":
      return "amber";
    case "DISPATCHED":
      return "blue";
    case "IN_PROGRESS":
      return "indigo";
    case "RESOLVED":
      return "green";
    default:
      return "gray";
  }
};

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold leading-none text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [role, setRole] = useState("");
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const showNotice = (ok: boolean, text: string) => {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get logged-in user's role
        const profileResponse = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.message || "Failed to get profile");
        }

        const userRole = profileData.user.role;
        setRole(userRole);
        setMyId(profileData.user._id || profileData.user.id || "");

        // Get emergencies
        const emergencyResponse = await fetch(
          "http://localhost:5000/api/emergencies",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const emergencyData = await emergencyResponse.json();

        if (!emergencyResponse.ok) {
          throw new Error(
            emergencyData.message || "Failed to fetch emergencies"
          );
        }

        if (Array.isArray(emergencyData)) {
          setEmergencies(emergencyData);
        } else if (Array.isArray(emergencyData.emergencies)) {
          setEmergencies(emergencyData.emergencies);
        } else {
          setEmergencies([]);
        }

        // Admin needs the officer list to dispatch
        if (userRole === "SUPER_ADMIN") {
          const officerResponse = await fetch(
            "http://localhost:5000/api/auth/officers",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const officerData = await officerResponse.json();
          setOfficers(officerData.officers || []);
        }
      } catch (error) {
        console.error("EMERGENCY ERROR:", error);
        setEmergencies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateEmergency = async (
    emergencyId: string,
    action: "assign" | "status",
    body: Record<string, string>,
    successText: string
  ) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/emergencies/${emergencyId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotice(false, data.message || "Action failed");
        return;
      }

      setEmergencies((current) =>
        current.map((item) =>
          item._id === emergencyId ? data.emergency : item
        )
      );

      showNotice(true, successText);
    } catch (error) {
      console.error("UPDATE EMERGENCY ERROR:", error);
      showNotice(false, "Something went wrong");
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const active = emergencies.filter((e) => e.status !== "RESOLVED");
  const criticalActive = active.filter((e) => e.priority === "CRITICAL").length;
  const awaiting = emergencies.filter((e) => e.status === "REPORTED").length;
  const resolved = emergencies.filter((e) => e.status === "RESOLVED").length;

  // Active first, CRITICAL first, then newest
  const visible = emergencies
    .filter(
      (e) =>
        (statusFilter === "ALL" || e.status === statusFilter) &&
        (priorityFilter === "ALL" || e.priority === priorityFilter)
    )
    .sort((a, b) => {
      const aDone = a.status === "RESOLVED" ? 1 : 0;
      const bDone = b.status === "RESOLVED" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      const aCrit = a.priority === "CRITICAL" ? 0 : 1;
      const bCrit = b.priority === "CRITICAL" ? 0 : 1;
      if (aCrit !== bCrit) return aCrit - bCrit;

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });

  const showActions = role === "SUPER_ADMIN" || role === "OFFICER";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Emergency Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {role === "CITIZEN"
              ? "Track the emergencies you have reported."
              : role === "OFFICER"
              ? "Respond to emergencies assigned to you."
              : "Monitor and dispatch reported city emergencies."}
          </p>
        </div>

        <Link
          href="/emergencies/report"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Report Emergency
        </Link>
      </header>

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Active" value={active.length} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={AlertTriangle} label="Critical (active)" value={criticalActive} color="bg-red-50 text-red-600" />
        <StatCard icon={Send} label="Awaiting dispatch" value={awaiting} color="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolved} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="ALL">All statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className={selectClass}
        >
          <option value="ALL">All priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
        </select>

        <span className="text-sm text-slate-500">
          Showing {visible.length} of {emergencies.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={AlertTriangle}
              title="No emergencies found"
              text={
                emergencies.length === 0
                  ? "Reported emergencies will appear here."
                  : "No emergencies match the selected filters."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Emergency</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reported By</th>
                  <th className="px-4 py-3 font-medium">Response</th>
                  <th className="px-4 py-3 font-medium">Reported</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  {showActions && (
                    <th className="px-4 py-3 font-medium">Action</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visible.map((emergency) => {
                  const isMine =
                    !myId || emergency.assignedOfficer?._id === myId;

                  return (
                    <tr
                      key={emergency._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-[260px] px-4 py-3.5">
                        <p className="font-medium text-slate-900">
                          {emergency.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {emergency.type}
                        </p>
                        {emergency.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {emergency.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge tone={priorityTone(emergency.priority)}>
                          {pretty(emergency.priority)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge tone={emergencyStatusTone(emergency.status)}>
                          {pretty(emergency.status)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {emergency.reportedBy?.name || "Unknown"}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {emergency.assignedOfficer ? (
                          <>
                            {emergency.assignedOfficer.name}
                            {emergency.department?.name && (
                              <span className="block text-xs text-slate-500">
                                {emergency.department.name}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">Not dispatched</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                        {emergency.createdAt
                          ? new Date(emergency.createdAt).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        {emergency.location ? (
                          <a
                            href={`https://www.google.com/maps?q=${emergency.location.latitude},${emergency.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            View map
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {showActions && (
                        <td className="px-4 py-3.5">
                          {/* Admin: dispatch */}
                          {role === "SUPER_ADMIN" &&
                            ["REPORTED", "DISPATCHED"].includes(
                              emergency.status
                            ) && (
                              <select
                                key={`${emergency._id}-${emergency.assignedOfficer?._id}`}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateEmergency(
                                      emergency._id,
                                      "assign",
                                      { officerId: e.target.value },
                                      "Emergency dispatched successfully"
                                    );
                                  }
                                }}
                                className={selectClass}
                              >
                                <option value="">
                                  {emergency.status === "REPORTED"
                                    ? "Dispatch officer"
                                    : "Reassign officer"}
                                </option>
                                {officers.map((officer) => (
                                  <option key={officer._id} value={officer._id}>
                                    {officer.name}
                                    {officer.department?.name
                                      ? ` · ${officer.department.name}`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            )}

                          {/* Officer: progress the emergency */}
                          {role === "OFFICER" &&
                            isMine &&
                            emergency.status === "DISPATCHED" && (
                              <button
                                onClick={() =>
                                  updateEmergency(
                                    emergency._id,
                                    "status",
                                    { status: "IN_PROGRESS" },
                                    "Marked as in progress"
                                  )
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                              >
                                Start Response
                              </button>
                            )}

                          {role === "OFFICER" &&
                            isMine &&
                            emergency.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Mark this emergency as resolved?"
                                    )
                                  ) {
                                    updateEmergency(
                                      emergency._id,
                                      "status",
                                      { status: "RESOLVED" },
                                      "Emergency marked as resolved"
                                    );
                                  }
                                }}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                              >
                                Mark Resolved
                              </button>
                            )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}