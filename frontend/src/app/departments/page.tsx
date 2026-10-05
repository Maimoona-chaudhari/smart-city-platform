"use client";

import { useEffect, useState } from "react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:5000/api/departments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("DEPARTMENTS RESPONSE:", data);

        setDepartments(data.departments || []);
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:5000/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setRole(data.user.role);
      });
  }, []);

  const createDepartment = async () => {
    const token = localStorage.getItem("token");

    if (!name || !code) {
      alert("Name and code are required");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/departments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          code,
          description,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to create department");
      return;
    }

    setDepartments((current) => [...current, data.department]);

    setName("");
    setCode("");
    setDescription("");

    alert("Department created successfully!");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        Departments
      </h1>

      <p className="mt-2 text-gray-600">
        View government departments.
      </p>

      {role === "SUPER_ADMIN" && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Add Department
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              type="text"
              placeholder="Department Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-lg border p-3"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border p-3 md:col-span-2"
            />

            <button
              onClick={createDepartment}
              className="rounded-lg bg-gray-900 px-5 py-3 text-white md:w-fit"
            >
              Add Department
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {departments.map((department) => (
          <div
            key={department._id}
            className="rounded-xl bg-white p-6 shadow"
          >
            <h2 className="text-xl font-bold text-gray-900">
              {department.name}
            </h2>

            <p className="mt-2 text-gray-500">
              Code: {department.code}
            </p>

            <p className="mt-3 text-gray-600">
              {department.description || "No description available."}
            </p>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <p className="mt-8 text-gray-500">
          No departments found.
        </p>
      )}
    </div>
  );
}