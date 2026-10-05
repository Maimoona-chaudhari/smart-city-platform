"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  FilePlus,
  FileText,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import "./globals.css";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title?: string; items: NavItem[] };

const dashboard: NavItem = { href: "/", label: "Dashboard", icon: LayoutDashboard };

const navByRole: Record<string, NavGroup[]> = {
  CITIZEN: [
    { items: [dashboard] },
    {
      title: "Complaints",
      items: [
        { href: "/complaints", label: "My Complaints", icon: FileText },
        { href: "/complaints/submit", label: "Submit Complaint", icon: FilePlus },
      ],
    },
        {
      title: "Emergencies",
      items: [
        { href: "/emergencies", label: "My Emergencies", icon: AlertTriangle },
        { href: "/emergencies/report", label: "Report Emergency", icon: ShieldAlert },
      ],
    },
    {
      title: "Updates",
      items: [{ href: "/notifications", label: "Notifications", icon: Bell }],
    },
  ],
  OFFICER: [
    { items: [dashboard] },
    {
      title: "Operations",
      items: [
        { href: "/complaints", label: "Complaints", icon: FileText },
         { href: "/emergencies", label: "Emergencies", icon: AlertTriangle },
        { href: "/assets", label: "Public Assets", icon: Landmark },
      ],
    },
    {
      title: "Updates",
      items: [{ href: "/notifications", label: "Notifications", icon: Bell }],
    },
  ],
  SUPER_ADMIN: [
    { items: [dashboard] },
    {
      title: "Operations",
      items: [
        { href: "/complaints", label: "Complaints", icon: FileText },
        { href: "/emergencies", label: "Emergencies", icon: AlertTriangle },
        { href: "/assets", label: "Public Assets", icon: Landmark },
        { href: "/gis", label: "GIS Map", icon: Map },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/departments", label: "Departments", icon: Building2 },
        { href: "/officers", label: "Officers", icon: Users },
        { href: "/workflows", label: "Workflows", icon: GitBranch },
      ],
    },
    {
      title: "Insights",
      items: [
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/notifications", label: "Notifications", icon: Bell },
      ],
    },
  ],
};

const roleLabel: Record<string, string> = {
  CITIZEN: "Citizen",
  OFFICER: "Officer",
  SUPER_ADMIN: "Smart City Admin",
};

const portalLabel: Record<string, string> = {
  CITIZEN: "Citizen Portal",
  OFFICER: "Officer Portal",
  SUPER_ADMIN: "Admin Operations Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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
        if (!data?.user) return;
        setRole(data.user.role);
        setName(data.user.name || "");
      })
      .catch((error) => console.error(error));
  }, []);

  // Close the mobile menu after navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const groups = navByRole[role] || [{ items: [dashboard] }];
  const allItems = groups.flatMap((group) => group.items);

  // The most specific matching link is the active one
  const activeHref = allItems
    .filter((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(item.href + "/")
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const pageTitle =
    allItems.find((item) => item.href === activeHref)?.label || "Smart City";

  const initial = (name || roleLabel[role] || "S").charAt(0).toUpperCase();

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          {/* Mobile overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
                  <Building2 className="h-4.5 w-4.5" />
                </span>
                <span className="text-lg font-semibold text-white">
                  Smart City
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
              {groups.map((group, index) => (
                <div key={group.title || index}>
                  {group.title && (
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {group.title}
                    </p>
                  )}

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.href === activeHref;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? "bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-400/30"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] ${
                              active ? "text-indigo-300" : ""
                            }`}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout */}
            {role && (
              <div className="border-t border-white/10 p-3">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Logout
                </button>
              </div>
            )}
          </aside>

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {pageTitle}
                  </h2>
                  <p className="truncate text-xs text-slate-500">
                    {portalLabel[role] || "Smart City"}
                  </p>
                </div>
              </div>

              {role && (
                <div className="flex items-center gap-3">
                  <Link
                    href="/notifications"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </Link>

                  <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {initial}
                    </span>
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-medium leading-tight text-slate-900">
                        {name || roleLabel[role]}
                      </p>
                      <p className="text-xs text-slate-500">{roleLabel[role]}</p>
                    </div>
                  </div>
                </div>
              )}
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}