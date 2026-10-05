"use client";

import { useEffect, useMemo, useState } from "react";

type Department = {
  _id: string;
  name: string;
};

type Complaint = {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  department?: Department;
};

type Emergency = {
  _id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
};

type Asset = {
  _id: string;
  name: string;
  type: string;
  status: string;
  department?: Department;
};

type AnalyticsData = {
  complaints: Complaint[];
  emergencies: Emergency[];
  assets: Asset[];
};

const statusList = [
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const priorityList = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

function getPercentage(
  value: number,
  total: number
) {
  if (!total) return 0;

  return Math.round((value / total) * 100);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    complaints: [],
    emergencies: [],
    assets: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

const response = await fetch(
  "http://localhost:5000/api/gis/map-data",
  {
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  }
);

        if (!response.ok) {
          throw new Error(
            "Failed to fetch analytics data"
          );
        }

        const result = await response.json();

        setData({
          complaints: result.complaints || [],
          emergencies: result.emergencies || [],
          assets: result.assets || [],
        });
      } catch (error) {
        console.error(
          "ANALYTICS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = useMemo(() => {
    const criticalComplaints =
      data.complaints.filter(
        (item) =>
          item.priority === "CRITICAL"
      ).length;

    const criticalEmergencies =
      data.emergencies.filter(
        (item) =>
          item.priority === "CRITICAL"
      ).length;

    const activeAssets =
      data.assets.filter(
        (item) =>
          item.status === "ACTIVE"
      ).length;

    return {
      complaints: data.complaints.length,
      emergencies: data.emergencies.length,
      assets: data.assets.length,
      critical:
        criticalComplaints +
        criticalEmergencies,
      activeAssets,
    };
  }, [data]);

  const statusCounts = useMemo(() => {
    return statusList.map((status) => ({
      status,
      count: data.complaints.filter(
        (complaint) =>
          complaint.status === status
      ).length,
    }));
  }, [data]);

  const priorityCounts = useMemo(() => {
    return priorityList.map((priority) => ({
      priority,
      count: data.complaints.filter(
        (complaint) =>
          complaint.priority === priority
      ).length,
    }));
  }, [data]);

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    data.complaints.forEach((complaint) => {
      const department =
        complaint.department?.name ||
        "Unassigned";

      counts[department] =
        (counts[department] || 0) + 1;
    });

    return Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Smart City Analytics
        </h1>

        <p className="mt-1 text-gray-500">
          Monitor city operations and identify
          service trends.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Complaints
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stats.complaints}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Emergencies
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stats.emergencies}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Public Assets
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stats.assets}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Critical Issues
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats.critical}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Active Assets
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.activeAssets}
          </p>
        </div>

      </div>

      {/* Main Analytics */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Complaint Status */}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-semibold">
            Complaint Status
          </h2>

          <div className="space-y-5">

            {statusCounts.map(
              ({ status, count }) => {
                const percentage =
                  getPercentage(
                    count,
                    stats.complaints
                  );

                return (
                  <div key={status}>

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="font-medium text-gray-700">
                        {status.replace(
                          "_",
                          " "
                        )}
                      </span>

                      <span className="text-gray-500">
                        {count} ({percentage}%)
                      </span>

                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* Priority */}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-semibold">
            Complaint Priority
          </h2>

          <div className="space-y-5">

            {priorityCounts.map(
              ({ priority, count }) => {
                const percentage =
                  getPercentage(
                    count,
                    stats.complaints
                  );

                return (
                  <div key={priority}>

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="font-medium text-gray-700">
                        {priority}
                      </span>

                      <span className="text-gray-500">
                        {count} ({percentage}%)
                      </span>

                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* Department Analytics */}

        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">

          <h2 className="mb-6 text-xl font-semibold">
            Complaints by Department
          </h2>

          {departmentCounts.length === 0 ? (
            <p className="text-gray-500">
              No department complaint data
              available.
            </p>
          ) : (
            <div className="space-y-5">

              {departmentCounts.map(
                ([department, count]) => {

                  const percentage =
                    getPercentage(
                      count,
                      stats.complaints
                    );

                  return (
                    <div key={department}>

                      <div className="mb-2 flex justify-between text-sm">

                        <span className="font-medium text-gray-700">
                          {department}
                        </span>

                        <span className="text-gray-500">
                          {count} complaints
                        </span>

                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </div>

      {/* Emergency Analytics */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-semibold">
            Emergency Overview
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Total Emergencies
              </span>

              <span className="text-xl font-bold">
                {stats.emergencies}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Critical Emergencies
              </span>

              <span className="text-xl font-bold text-red-600">
                {
                  data.emergencies.filter(
                    (item) =>
                      item.priority ===
                      "CRITICAL"
                  ).length
                }
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                High Priority Emergencies
              </span>

              <span className="text-xl font-bold text-orange-600">
                {
                  data.emergencies.filter(
                    (item) =>
                      item.priority ===
                      "HIGH"
                  ).length
                }
              </span>
            </div>

          </div>

        </div>

        {/* Asset Overview */}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-semibold">
            Public Asset Overview
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Total Assets
              </span>

              <span className="text-xl font-bold">
                {stats.assets}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Active Assets
              </span>

              <span className="text-xl font-bold text-green-600">
                {
                  data.assets.filter(
                    (asset) =>
                      asset.status ===
                      "ACTIVE"
                  ).length
                }
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Damaged Assets
              </span>

              <span className="text-xl font-bold text-red-600">
                {
                  data.assets.filter(
                    (asset) =>
                      asset.status ===
                      "DAMAGED"
                  ).length
                }
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span>
                Under Maintenance
              </span>

              <span className="text-xl font-bold text-orange-600">
                {
                  data.assets.filter(
                    (asset) =>
                      asset.status ===
                      "UNDER_MAINTENANCE"
                  ).length
                }
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}