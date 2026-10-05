"use client";

import { useEffect, useState } from "react";

export default function OfficersPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchOfficers = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/officers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch officers");
      }

      setOfficers(data.officers || []);
    } catch (error) {
      console.error("OFFICERS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/departments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch departments"
        );
      }

      setDepartments(data.departments || []);
    } catch (error) {
      console.error("DEPARTMENTS ERROR:", error);
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchDepartments();
  }, []);

  const createOfficer = async () => {
    if (!name || !email || !password || !department) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/officers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            password,
            department,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create officer");
        return;
      }

      setOfficers((current) => [
        ...current,
        data.officer,
      ]);

      setName("");
      setEmail("");
      setPassword("");
      setDepartment("");

      alert("Officer created successfully!");
    } catch (error) {
      console.error("CREATE OFFICER ERROR:", error);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">
          Loading officers...
        </h1>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        Officers Management
      </h1>

      <p className="mt-2 text-gray-600">
        Create and manage smart city officers.
      </p>

      {/* Create Officer */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900">
          Create Officer
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Officer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border p-3"
          />

          <input
            type="email"
            placeholder="Officer Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border p-3"
          />

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border p-3"
          >
            <option value="">
              Select Department
            </option>

            {departments.map((item) => (
              <option
                key={item._id}
                value={item._id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <button
            onClick={createOfficer}
            className="rounded-lg bg-gray-900 px-5 py-3 text-white md:w-fit"
          >
            Create Officer
          </button>
        </div>
      </div>

      {/* Officers List */}
      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Email
              </th>

              <th className="p-4 text-left">
                Department
              </th>

              <th className="p-4 text-left">
                Role
              </th>
            </tr>
          </thead>

          <tbody>
            {officers.map((officer) => (
              <tr
                key={officer._id}
                className="border-t"
              >
                <td className="p-4">
                  {officer.name}
                </td>

                <td className="p-4">
                  {officer.email}
                </td>

                <td className="p-4">
                  {officer.department?.name ||
                    "Not assigned"}
                </td>

                <td className="p-4">
                  {officer.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {officers.length === 0 && (
          <p className="p-6 text-gray-500">
            No officers found.
          </p>
        )}
      </div>
    </div>
  );
}