"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () =>
    import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () =>
    import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () =>
    import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () =>
    import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type Department = {
  _id: string;
  name: string;
};

type Location = {
  latitude: number;
  longitude: number;
};

type Asset = {
  _id: string;
  name: string;
  type: string;
  status: string;
  location: Location;
  department?: Department;
};

type Complaint = {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  location: Location;
  department?: Department;
  assignedOfficer?: {
    _id: string;
    name: string;
  };
};

type Emergency = {
  _id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  location: Location;
};

type MapData = {
  assets: Asset[];
  complaints: Complaint[];
  emergencies: Emergency[];
};

type Filter = "ALL" | "COMPLAINTS" | "EMERGENCIES" | "ASSETS";

export default function GISPage() {
  const [data, setData] = useState<MapData>({
    assets: [],
    complaints: [],
    emergencies: [],
  });

  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
useEffect(() => {
  const fixLeafletIcons = async () => {
    const L = await import("leaflet");

    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });
  };

  fixLeafletIcons();
}, []);
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const token = localStorage.getItem("token"); 
        const response = await fetch(
          "http://localhost:5000/api/gis/map-data",
          {
            credentials: "include",
            headers: {
      "Authorization": `Bearer ${token}`, // ye line add karein
    },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch GIS data");
        }

        const result = await response.json();

        setData({
          assets: result.assets || [],
          complaints: result.complaints || [],
          emergencies: result.emergencies || [],
        });
      } catch (error) {
        console.error("GIS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  const totals = useMemo(() => {
    return {
      complaints: data.complaints.length,
      emergencies: data.emergencies.length,
      assets: data.assets.length,

      critical:
        data.complaints.filter(
          (item) => item.priority === "CRITICAL"
        ).length +
        data.emergencies.filter(
          (item) => item.priority === "CRITICAL"
        ).length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">
          Loading Smart City GIS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Smart City GIS Operations
        </h1>

        <p className="mt-1 text-gray-500">
          Monitor complaints, emergencies and public assets
          across the city.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Complaints
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {totals.complaints}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Emergencies
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-600">
            {totals.emergencies}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Public Assets
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {totals.assets}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Critical Issues
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {totals.critical}
          </p>
        </div>
      </div>

      {/* Filters */}

      <div className="mb-4 flex flex-wrap gap-3">
        {[
          ["ALL", "All"],
          ["COMPLAINTS", "Complaints"],
          ["EMERGENCIES", "Emergencies"],
          ["ASSETS", "Public Assets"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value as Filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === value
                ? "bg-black text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <MapContainer
          center={[33.5651, 73.0169]}
          zoom={12}
          scrollWheelZoom={true}
          style={{
            height: "650px",
            width: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Complaints */}

         {(filter === "ALL" ||
  filter === "COMPLAINTS") &&
  data.complaints
    .filter((complaint) => complaint.location?.latitude && complaint.location?.longitude)
    .map((complaint) => (
              <Marker
                key={`complaint-${complaint._id}`}
                position={[
                  complaint.location.latitude,
                  complaint.location.longitude,
                ]}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="text-lg font-bold">
                      {complaint.title}
                    </h3>

                    <p className="mt-2">
                      Category: {complaint.category}
                    </p>

                    <p>
                      Priority: {complaint.priority}
                    </p>

                    <p>
                      Status: {complaint.status}
                    </p>

                    <p>
                      Department:{" "}
                      {complaint.department?.name ||
                        "Not assigned"}
                    </p>

                    <p>
                      Officer:{" "}
                      {complaint.assignedOfficer?.name ||
                        "Not assigned"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Emergencies */}

          {(filter === "ALL" ||
            filter === "EMERGENCIES") &&
            data.emergencies.map((emergency) => (
              <Marker
                key={`emergency-${emergency._id}`}
                position={[
                  emergency.location.latitude,
                  emergency.location.longitude,
                ]}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="text-lg font-bold">
                      🚨 {emergency.title}
                    </h3>

                    <p className="mt-2">
                      Type: {emergency.type}
                    </p>

                    <p>
                      Priority: {emergency.priority}
                    </p>

                    <p>
                      Status: {emergency.status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Assets */}

          {(filter === "ALL" ||
            filter === "ASSETS") &&
            data.assets.map((asset) => (
              <Marker
                key={`asset-${asset._id}`}
                position={[
                  asset.location.latitude,
                  asset.location.longitude,
                ]}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <h3 className="text-lg font-bold">
                      🔵 {asset.name}
                    </h3>

                    <p className="mt-2">
                      Type: {asset.type}
                    </p>

                    <p>
                      Status: {asset.status}
                    </p>

                    <p>
                      Department:{" "}
                      {asset.department?.name ||
                        "Not assigned"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Legend */}

      <div className="mt-4 flex flex-wrap gap-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm">
            Complaints
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-sm">
            Emergencies
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm">
            Public Assets
          </span>
        </div>
      </div>
    </div>
  );
}