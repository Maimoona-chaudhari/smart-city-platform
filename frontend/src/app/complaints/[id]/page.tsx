"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  FileX,
  MapPin,
  Paperclip,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  PageSkeleton,
  Panel,
  priorityTone,
  pretty,
  statusTone,
} from "../../../components/ui";
import { SlaTimer } from "../../../components/SlaTimer";

type WorkflowStep = {
  name: string;
  description?: string;
  order: number;
};

type Complaint = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: string;
  slaDeadline?: string;
  slaViolated?: boolean;
  resolvedAt?: string;
  currentWorkflowStep?: number;
  location?: { latitude?: number; longitude?: number };
  citizen?: { _id: string; name: string; email: string };
  department?: { _id: string; name: string; code?: string };
  assignedOfficer?: { _id: string; name: string; email: string };
  attachments?: { url: string; publicId: string; name: string; type: string }[];
  workflow?: {
    _id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
  };
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : "Not available";

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function ComplaintDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/complaints/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load complaint");
        }

        return data;
      })
      .then((data) => {
        setComplaint(data.complaint || null);
      })
      .catch((err) => {
        console.error("COMPLAINT DETAILS ERROR:", err);
        setError(err.message || "Failed to load complaint");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to complaints
        </Link>

        <EmptyState
          icon={FileX}
          title="Complaint unavailable"
          text={error || "This complaint could not be found."}
        />
      </div>
    );
  }

  const currentStep = complaint.currentWorkflowStep || 1;
  const sortedSteps = complaint.workflow
    ? [...complaint.workflow.steps].sort((a, b) => a.order - b.order)
    : [];
  const { latitude, longitude } = complaint.location || {};
  const hasLocation = latitude !== undefined && longitude !== undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to complaints
      </Link>

      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {complaint.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {complaint.category}
              {complaint.createdAt && ` · Submitted ${formatDate(complaint.createdAt)}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={priorityTone(complaint.priority)}>
              {pretty(complaint.priority)}
            </Badge>
            <Badge tone={statusTone(complaint.status)}>
              {pretty(complaint.status)}
            </Badge>
            {complaint.slaViolated === true && (
              <Badge tone="red">SLA Violated</Badge>
            )}
          </div>
        </div>

        {complaint.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {complaint.description}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Panel title="Complaint Details">
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoItem label="Department">
                {complaint.department?.name || "Not assigned"}
              </InfoItem>

              <InfoItem label="Assigned Officer">
                {complaint.assignedOfficer ? (
                  <>
                    {complaint.assignedOfficer.name}
                    <span className="block text-xs text-slate-500">
                      {complaint.assignedOfficer.email}
                    </span>
                  </>
                ) : (
                  "Not assigned"
                )}
              </InfoItem>

              <InfoItem label="Submitted By">
                {complaint.citizen ? (
                  <>
                    {complaint.citizen.name}
                    <span className="block text-xs text-slate-500">
                      {complaint.citizen.email}
                    </span>
                  </>
                ) : (
                  "Not available"
                )}
              </InfoItem>

                           <InfoItem label="SLA Deadline">
                {formatDate(complaint.slaDeadline)}
                <div className="mt-2">
                  <SlaTimer
                    createdAt={complaint.createdAt}
                    deadline={complaint.slaDeadline}
                    status={complaint.status}
                    resolvedAt={complaint.resolvedAt}
                  />
                </div>
              </InfoItem>

              {complaint.resolvedAt && (
                <InfoItem label="Resolved At">
                  {formatDate(complaint.resolvedAt)}
                </InfoItem>
              )}

              {hasLocation && (
                <InfoItem label="Location">
                  <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {latitude}, {longitude}
                  </a>
                </InfoItem>
              )}
            </dl>
          </Panel>

          {/* Evidence */}
          <Panel title="Evidence" description="Files attached to this complaint">
            {complaint.attachments && complaint.attachments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {complaint.attachments.map((attachment, index) => (
                  <a
                    key={attachment.publicId || index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:shadow-md"
                  >
                    {attachment.type?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-slate-400">
                        <Paperclip className="h-8 w-8" />
                      </div>
                    )}
                    <p className="truncate px-3 py-2 text-xs text-slate-600">
                      {attachment.name}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Paperclip}
                title="No evidence attached"
                text="The citizen did not upload any files."
              />
            )}
          </Panel>
        </div>

        {/* Workflow */}
        <Panel
          title="Workflow Progress"
          description={complaint.workflow?.name}
        >
          {sortedSteps.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No workflow"
              text="No workflow is linked to this complaint."
            />
          ) : (
            <div>
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

                    <div className="ml-3 pb-5">
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
                      {step.description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}