"use client";

import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch notifications"
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(
        "NOTIFICATIONS ERROR:",
        error
      );

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;
  }, [notifications]);

  const markAsRead = async (
    notificationId: string
  ) => {
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as read"
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "MARK READ ERROR:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    setMarkingAll(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark all notifications as read"
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "MARK ALL READ ERROR:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Notifications
        </h1>

        <p className="mt-4 text-gray-500">
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Notifications
          </h1>

          <p className="mt-2 text-gray-600">
            Stay updated with your latest
            city operations and complaint
            updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-50"
          >
            {markingAll
              ? "Marking..."
              : "Mark all as read"}
          </button>
        )}

      </div>

      {/* Unread count */}

      <div className="mt-6">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            unreadCount > 0
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {unreadCount > 0
            ? `${unreadCount} unread`
            : "All notifications read"}
        </span>
      </div>

      {/* Notifications */}

      <div className="mt-8 space-y-4">

        {notifications.map(
          (notification) => (
            <div
              key={notification._id}
              className={`rounded-xl border p-5 transition ${
                notification.isRead
                  ? "border-gray-100 bg-white shadow-sm"
                  : "border-blue-200 bg-blue-50 shadow-md"
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex gap-3">

                  <div
                    className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead
                        ? "bg-gray-100"
                        : "bg-blue-100"
                    }`}
                  >
                    🔔
                  </div>

                  <div>

                    <h2 className="font-bold text-gray-900">
                      {notification.title}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(
                        notification.createdAt
                      )}
                    </p>

                  </div>

                </div>

                {!notification.isRead && (
                  <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
                    New
                  </span>
                )}

              </div>

              {/* Individual read button */}

              {!notification.isRead && (
                <div className="mt-4 border-t border-blue-100 pt-3">

                  <button
                    onClick={() =>
                      markAsRead(
                        notification._id
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Mark as read
                  </button>

                </div>
              )}

            </div>
          )
        )}

        {/* Empty State */}

        {notifications.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <div className="text-4xl">
              🔔
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No notifications
            </h2>

            <p className="mt-2 text-gray-500">
              You're all caught up.
            </p>

          </div>
        )}

      </div>
    </div>
  );
}