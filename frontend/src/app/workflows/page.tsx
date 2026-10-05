"use client";

import { useEffect, useState } from "react";

type Department = {
  _id: string;
  name: string;
  code?: string;
};

type WorkflowStep = {
  name: string;
  description?: string;
  order: number;
};

type Workflow = {
  _id: string;
  name: string;
  description?: string;
  department?: Department;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      name: "",
      description: "",
      order: 1,
    },
  ]);

  const [creating, setCreating] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchWorkflows = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/workflows",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }

      const data = await response.json();

      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("WORKFLOWS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const addStep = () => {
    setSteps((current) => [
      ...current,
      {
        name: "",
        description: "",
        order: current.length + 1,
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((current) =>
      current
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({
          ...step,
          order: stepIndex + 1,
        }))
    );
  };

  const updateStep = (
    index: number,
    field: "name" | "description",
    value: string
  ) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index
          ? {
              ...step,
              [field]: value,
            }
          : step
      )
    );
  };

  const createWorkflow = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!token) {
      alert("Please login first");
      return;
    }

    if (!name.trim()) {
      alert("Workflow name is required");
      return;
    }

    if (
      steps.some(
        (step) => !step.name.trim()
      )
    ) {
      alert("Every step needs a name");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/workflows",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            steps,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create workflow"
        );
      }

      alert("Workflow created successfully");

      setName("");
      setDescription("");

      setSteps([
        {
          name: "",
          description: "",
          order: 1,
        },
      ]);

      fetchWorkflows();
    } catch (error) {
      console.error(
        "CREATE WORKFLOW ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create workflow"
      );
    } finally {
      setCreating(false);
    }
  };

  const deleteWorkflow = async (
    workflowId: string
  ) => {
    if (!token) return;

    const confirmed = confirm(
      "Are you sure you want to delete this workflow?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/workflows/${workflowId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete workflow"
        );
      }

      setWorkflows((current) =>
        current.filter(
          (workflow) =>
            workflow._id !== workflowId
        )
      );
    } catch (error) {
      console.error(
        "DELETE WORKFLOW ERROR:",
        error
      );

      alert("Failed to delete workflow");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Workflows
        </h1>

        <p className="mt-4 text-gray-500">
          Loading workflows...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Workflow Management
        </h1>

        <p className="mt-2 text-gray-600">
          Create and manage complaint resolution
          workflows.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Create Workflow
        </h2>

        <form
          onSubmit={createWorkflow}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Workflow Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Complaint Resolution Workflow"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe this workflow..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Workflow Steps
              </h3>

              <button
                type="button"
                onClick={addStep}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-4">
              {steps.map(
                (step, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Step {index + 1}
                      </span>

                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeStep(index)
                          }
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      value={step.name}
                      onChange={(event) =>
                        updateStep(
                          index,
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Step name"
                      className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                    />

                    <input
                      value={
                        step.description || ""
                      }
                      onChange={(event) =>
                        updateStep(
                          index,
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Step description"
                      className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:opacity-80 disabled:opacity-50"
          >
            {creating
              ? "Creating..."
              : "Create Workflow"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Existing Workflows
        </h2>

        <div className="mt-4 space-y-4">
          {workflows.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                No workflows created yet.
              </p>
            </div>
          ) : (
            workflows.map(
              (workflow) => (
                <div
                  key={workflow._id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {workflow.name}
                      </h3>

                      {workflow.description && (
                        <p className="mt-2 text-gray-600">
                          {
                            workflow.description
                          }
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        deleteWorkflow(
                          workflow._id
                        )
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {workflow.steps
                      .sort(
                        (a, b) =>
                          a.order - b.order
                      )
                      .map(
                        (step) => (
                          <div
                            key={step.order}
                            className="flex gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                              {
                                step.order
                              }
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {
                                  step.name
                                }
                              </p>

                              {step.description && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {
                                    step.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}