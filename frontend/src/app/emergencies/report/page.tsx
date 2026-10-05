"use client";

import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crosshair, Loader2, Send } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Panel } from "../../../components/ui";

/* ---------- Leaflet pieces (client only) ---------- */

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

// Places the pin where the user clicks on the map
const MapClickHandler = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMapEvents } = mod;

      function Handler({
        onPick,
      }: {
        onPick: (lat: number, lng: number) => void;
      }) {
        useMapEvents({
          click(event) {
            onPick(event.latlng.lat, event.latlng.lng);
          },
        });
        return null;
      }

      return Handler;
    }),
  { ssr: false }
);

// Moves the map when "Use my location" finds the user
const MapFocus = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;

      function Focus({
        target,
      }: {
        target: { lat: number; lng: number; id: number } | null;
      }) {
        const map = useMap();

        useEffect(() => {
          if (target) {
            map.setView([target.lat, target.lng], Math.max(map.getZoom(), 15));
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [target?.id]);

        return null;
      }

      return Focus;
    }),
  { ssr: false }
);

/* ---------- Form data ---------- */

const emergencyTypes = [
  "Fire",
  "Medical Emergency",
  "Road Accident",
  "Flood",
  "Gas Leak",
  "Building Collapse",
  "Security / Crime",
  "Other",
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function ReportEmergencyPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState(emergencyTypes[0]);
  const [priority, setPriority] = useState("HIGH");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [focus, setFocus] = useState<{ lat: number; lng: number; id: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fix Leaflet marker icons (same setup as the GIS page)
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

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasLocation =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const pickLocation = (pickedLat: number, pickedLng: number) => {
    setLatitude(pickedLat.toFixed(6));
    setLongitude(pickedLng.toFixed(6));
  };

  const useMyLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        pickLocation(userLat, userLng);
        setFocus({ lat: userLat, lng: userLng, id: Date.now() });
        setLocating(false);
      },
      () => {
        setError(
          "Could not get your location. Allow location access, or click on the map to choose it."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!hasLocation) {
      setError("Please choose the location on the map or use your location.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/emergencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          location: { latitude: lat, longitude: lng },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to report emergency");
        setSubmitting(false);
        return;
      }

      router.push("/emergencies");
    } catch (err) {
      console.error("REPORT EMERGENCY ERROR:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/emergencies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to emergencies
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Report an Emergency
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Describe what is happening and mark where it is. Responders will be
          notified.
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <Panel title="Emergency Details">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Fire in market building"
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  {emergencyTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={inputClass}
                >
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (life at risk)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="What is happening? How many people are affected?"
                className={inputClass}
              />
            </div>
          </div>
        </Panel>

        {/* Location */}
        <Panel
          title="Location"
          description="Click on the map to drop a pin, or use your current location."
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              {locating ? "Finding location..." : "Use my location"}
            </button>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <MapContainer
                center={[33.5651, 73.0169]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "320px", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onPick={pickLocation} />
                <MapFocus target={focus} />
                {hasLocation && <Marker position={[lat, lng]} />}
              </MapContainer>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Latitude</label>
                <input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="33.5651"
                  inputMode="decimal"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Longitude</label>
                <input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="73.0169"
                  inputMode="decimal"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* Submit */}
        <div className="space-y-3 lg:col-span-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Reporting..." : "Report Emergency"}
          </button>
        </div>
      </form>
    </div>
  );
}