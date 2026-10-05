"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitComplaintPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("STREET_LIGHT");
  const [priority, setPriority] = useState("MEDIUM");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("priority", priority);

      formData.append(
        "location",
        JSON.stringify({
          latitude: Number(latitude),
          longitude: Number(longitude),
        })
      );

      if (evidence) {
        formData.append("evidence", evidence);
      }

      const response = await fetch(
        "http://localhost:5000/api/complaints",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to submit complaint");
        return;
      }

      alert("Complaint submitted successfully!");
      router.push("/complaints");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        Submit Complaint
      </h1>

      <p className="mt-2 text-gray-600">
        Report an issue to the relevant government department.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-2xl space-y-5 rounded-xl bg-white p-8 shadow"
      >
        <div>
          <label className="mb-2 block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken street light"
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem..."
            className="w-full rounded-lg border p-3"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="STREET_LIGHT">Street Light</option>
            <option value="ROAD">Road</option>
            <option value="GARBAGE">Garbage</option>
            <option value="WATER">Water</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="TRAFFIC">Traffic</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="33.5651"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="73.0169"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Evidence Image
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setEvidence(e.target.files?.[0] || null);
            }}
            className="w-full rounded-lg border p-3"
          />

          <p className="mt-1 text-sm text-gray-500">
            JPG, PNG or WebP. Maximum 5MB. Optional.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 p-3 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}