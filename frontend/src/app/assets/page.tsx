"use client";

import { useEffect, useState } from "react";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [role, setRole] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("STREET_LIGHT");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:5000/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) {
          setRole(data.user.role);
        }
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:5000/api/assets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("ASSETS RESPONSE:", data);

        if (Array.isArray(data)) {
          setAssets(data);
        } else {
          setAssets([]);
        }
      })
      .catch((error) => console.error(error));

    // Fetch departments so SUPER_ADMIN can pick one when creating an asset
    fetch("http://localhost:5000/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.departments)) {
          setDepartments(data.departments);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  const updateAssetStatus = async (assetId: string, newStatus: string) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/assets/${assetId}/status`,
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
      alert(result.message || "Failed to update asset status");
      return;
    }

    setAssets((current) =>
      current.map((item) =>
        item._id === assetId ? { ...item, status: newStatus } : item
      )
    );

    alert("Asset status updated successfully!");
  };

  const createAsset = async () => {
    const token = localStorage.getItem("token");

    if (!name || !type || !latitude || !longitude) {
      alert("Name, type, latitude and longitude are required");
      return;
    }

    if (role === "SUPER_ADMIN" && !departmentId) {
      alert("Please select a department");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/assets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            type,
            description,
            location: {
              latitude: Number(latitude),
              longitude: Number(longitude),
            },
            department: departmentId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create asset");
        return;
      }

      setAssets((current) => [...current, data.asset]);

      setName("");
      setType("STREET_LIGHT");
      setDescription("");
      setLatitude("");
      setLongitude("");
      setDepartmentId("");

      alert("Asset created successfully!");
    } catch (error) {
      console.error("CREATE ASSET ERROR:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        Public Assets
      </h1>

      <p className="mt-2 text-gray-600">
        View and manage public city assets.
      </p>

      {role === "SUPER_ADMIN" && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Add Public Asset
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Asset Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border p-3"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border p-3"
            >
              <option value="STREET_LIGHT">STREET_LIGHT</option>
              <option value="ROAD">ROAD</option>
              <option value="WATER_PIPE">WATER_PIPE</option>
              <option value="ELECTRICITY">ELECTRICITY</option>
              <option value="OTHER">OTHER</option>
            </select>

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-lg border p-3 md:col-span-2"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border p-3 md:col-span-2"
            />

            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="rounded-lg border p-3"
            />

            <button
              onClick={createAsset}
              className="rounded-lg bg-gray-900 px-5 py-3 text-white md:w-fit"
            >
              Add Asset
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Location</th>
            </tr>
          </thead>

          <tbody>
            {assets.map((asset) => (
              <tr key={asset._id} className="border-t">
                <td className="p-4">{asset.name}</td>
                <td className="p-4">{asset.type}</td>

                <td className="p-4">
                  {role === "OFFICER" ? (
                    <select
                      value={asset.status}
                      onChange={(e) =>
                        updateAssetStatus(asset._id, e.target.value)
                      }
                      className="rounded-lg border p-2"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DAMAGED">DAMAGED</option>
                      <option value="UNDER_MAINTENANCE">
                        UNDER_MAINTENANCE
                      </option>
                    </select>
                  ) : (
                    asset.status
                  )}
                </td>

                <td className="p-4">
                  {asset.location?.latitude}, {asset.location?.longitude}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assets.length === 0 && (
          <p className="p-6 text-gray-500">
            No public assets found.
          </p>
        )}
      </div>
    </div>
  );
}
