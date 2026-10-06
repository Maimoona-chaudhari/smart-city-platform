"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Eye, Inbox } from "lucide-react";
import {
  Badge,
  EmptyState,
  PageSkeleton,
  priorityTone,
  pretty,
  statusTone,
} from "../../components/ui";
import { SlaTimer } from "../../components/SlaTimer";
type WorkflowStep = {
  name: string;
  description?: string;
  order: number;
};

type ComplaintWorkflow = {
  _id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
};

type ComplaintAttachment = {
  url: string;
  publicId: string;
  name: string;
  type: string;
};

type Complaint = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;

  department?: {
    _id: string;
    name: string;
    code?: string;
  };

  assignedOfficer?: {
    _id: string;
    name: string;
    email: string;
  };

  attachments?: ComplaintAttachment[];

  workflow?: ComplaintWorkflow;
  currentWorkflowStep?: number;
    createdAt?: string;
  slaDeadline?: string;
  resolvedAt?: string | null;
};

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function WorkflowCard({
  complaint,
  currentStep,
  sortedSteps,
}: {
  complaint: Complaint;
  currentStep: number;
  sortedSteps: WorkflowStep[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {complaint.title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {complaint.workflow?.name}
          </p>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 sm:px-6 sm:pb-6">
          {complaint.workflow?.description && (
            <p className="mt-4 text-sm text-slate-600">
              {complaint.workflow.description}
            </p>
          )}

          <div className="mt-5">
            {sortedSteps.map((step, index) => {
              const isCompleted = step.order < currentStep;
              const isCurrent = step.order === currentStep;
              const isLast = index === sortedSteps.length - 1;

              return (
                <div key={step.order} className="flex">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : step.order}
                    </div>

                    {!isLast && (
                      <div
                        className={`h-8 w-0.5 ${
                          isCompleted ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className="ml-4 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent
                            ? "text-indigo-700"
                            : isCompleted
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {step.name}
                      </p>
                      {isCurrent && <Badge tone="indigo">Current Step</Badge>}
                      {isCompleted && <Badge tone="green">Completed</Badge>}
                    </div>

                    {step.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComplaintsPage() {
  const [role, setRole] = useState("");
  const [myId, setMyId] = useState("");
  const [tab, setTab] = useState<"ASSIGNED" | "DEPARTMENT">("ASSIGNED");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    // Officers fetch
    fetch("http://localhost:5000/api/auth/officers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOfficers(data.officers || []);
      })
      .catch((error) => {
        console.error("OFFICERS ERROR:", error);
      });

    // Get logged-in user's role
    fetch("http://localhost:5000/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to get profile");
        }

        return data;
      })
      .then((profile) => {
        const userRole = profile.user.role;

        setRole(userRole);
setMyId(profile.user.id || profile.user._id || "");
        let url = "";

        if (userRole === "CITIZEN") {
          url = "http://localhost:5000/api/complaints/my";
        } else if (userRole === "OFFICER") {
          url = "http://localhost:5000/api/complaints/department";
        } else if (userRole === "SUPER_ADMIN") {
          url = "http://localhost:5000/api/complaints/all";
        }

        if (!url) {
          setLoading(false);
          return;
        }

        return fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
      .then(async (res) => {
        if (!res) return null;

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch complaints");
        }

        return data;
      })
      .then((data) => {
        if (!data) return;

        if (Array.isArray(data)) {
          setComplaints(data);
        } else if (Array.isArray(data.complaints)) {
          setComplaints(data.complaints);
        } else {
          setComplaints([]);
        }
      })
      .catch((error) => {
        console.error("COMPLAINT ERROR:", error);
        setComplaints([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const assignOfficer = async (complaintId: string, officerId: string) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/complaints/${complaintId}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          officerId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Failed to assign officer");
      return;
    }

    setComplaints((current) =>
      current.map((item) =>
        item._id === complaintId
          ? {
              ...item,
              status: "ASSIGNED",
              currentWorkflowStep: 3,
              assignedOfficer: result.complaint.assignedOfficer,
              workflow: result.complaint.workflow || item.workflow,
            }
          : item
      )
    );

    alert("Officer assigned successfully!");
  };

  const updateStatus = async (complaintId: string, newStatus: string) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/complaints/${complaintId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Failed to update status");
      return;
    }

    const workflowStepMap: Record<string, number> = {
      SUBMITTED: 1,
      ASSIGNED: 3,
      IN_PROGRESS: 4,
      RESOLVED: 5,
      CLOSED: 6,
    };

    setComplaints((current) =>
      current.map((item) =>
        item._id === complaintId
          ? {
              ...item,
              status: newStatus,
              currentWorkflowStep: workflowStepMap[newStatus],
              resolvedAt: result.complaint.resolvedAt || item.resolvedAt,
              workflow: result.complaint.workflow || item.workflow,
            }
          : item
      )
    );

    alert("Complaint status updated successfully!");
  };

  if (loading) {
    return <PageSkeleton />;
  }
  const assignedToMe = complaints.filter(
    (c) => myId && c.assignedOfficer?._id === myId
  );

  const visibleComplaints =
    role === "OFFICER" && tab === "ASSIGNED" ? assignedToMe : complaints;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {role === "CITIZEN"
            ? "My Complaints"
            : role === "OFFICER"
            ? "Department Complaints"
            : "All Complaints"}
        </h1>

        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          {role === "CITIZEN"
            ? "Track your submitted complaints and their status."
            : role === "OFFICER"
            ? "omplaints assigned to your department."
            : "View and manage all citizen complaints."}
        </p>
      </header>
      {role === "OFFICER" && (
        <div className="flex flex-wrap gap-2">
          {[
            ["ASSIGNED", "Assigned to me", assignedToMe.length],
            ["DEPARTMENT", "Department", complaints.length],
          ].map(([value, label, count]) => (
            <button
              key={value}
              onClick={() => setTab(value as "ASSIGNED" | "DEPARTMENT")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visibleComplaints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Inbox}
              title="No complaints found"
              text="Complaints will appear here once they are available."
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Assigned Officer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
               {visibleComplaints.map((complaint) => (
                  <tr
                    key={complaint._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="max-w-[240px] px-4 py-3.5 font-medium text-slate-900">
                      <span className="line-clamp-2">{complaint.title}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      {complaint.category}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge tone={priorityTone(complaint.priority)}>
                        {pretty(complaint.priority)}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      {complaint.department?.name || "Not assigned"}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      {complaint.assignedOfficer?.name || "Not assigned"}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge tone={statusTone(complaint.status)}>
                        {pretty(complaint.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <SlaTimer
                        createdAt={complaint.createdAt}
                        deadline={complaint.slaDeadline}
                        status={complaint.status}
                        resolvedAt={complaint.resolvedAt}
                      />
                    </td>
                    {/* Evidence */}
                    <td className="px-4 py-3.5">
                      {complaint.attachments &&
                      complaint.attachments.length > 0 ? (
                        <div className="space-y-1.5">
                          {complaint.attachments.map((attachment, index) => (
                            <a
                              key={attachment.publicId || index}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                            >
                              View Image
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No evidence
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/complaints/${complaint._id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>

                        {/* Super Admin */}
                        {role === "SUPER_ADMIN" && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                assignOfficer(complaint._id, e.target.value);
                              }
                            }}
                            className={selectClass}
                          >
                            <option value="">Assign Officer</option>

                            {officers
                              .filter(
                                (officer) =>
                                  officer.department?._id ===
                                  complaint.department?._id
                              )
                              .map((officer) => (
                                <option key={officer._id} value={officer._id}>
                                  {officer.name}
                                </option>
                              ))}
                          </select>
                        )}

                        {/* Officer */}
                      {role === "OFFICER" && myId &&
                        complaint.assignedOfficer?._id === myId && (
                          <select
                            value={complaint.status}
                            onChange={(e) =>
                              updateStatus(complaint._id, e.target.value)
                            }
                            className={selectClass}
                          >
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Progress */}
     {visibleComplaints.length > 0 && (
        <div className="space-y-4">
         {visibleComplaints.map((complaint) => {
            if (!complaint.workflow) {
              return null;
            }

            const currentStep = complaint.currentWorkflowStep || 1;

            const sortedSteps = [...complaint.workflow.steps].sort(
              (a, b) => a.order - b.order
            );

            return (
              <WorkflowCard
                key={`workflow-${complaint._id}`}
                complaint={complaint}
                currentStep={currentStep}
                sortedSteps={sortedSteps}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
