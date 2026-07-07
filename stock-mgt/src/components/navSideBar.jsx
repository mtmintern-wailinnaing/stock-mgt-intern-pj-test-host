"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  GitCompare,
  Users,
  CircleUser,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import {
  getStockNavSource,
  isMonthStockPath,
  setStockNavSource,
} from "@/lib/stock-nav";
import { useAuth } from "./AuthProvider";

const navigation = [
  {
    name: "Dashboard",
    href: "/stock",
    icon: LayoutDashboard,
    navSource: "dashboard",
    isActive: (pathname, stockNavSource) =>
      pathname === "/stock" ||
      /^\/stock\/\d+$/.test(pathname) ||
      (isMonthStockPath(pathname) && stockNavSource === "dashboard"),
  },
  {
    name: "Stock Mgt",
    href: "/stock/current",
    icon: Package,
    navSource: "stock-mgt",
    isActive: (pathname, stockNavSource) =>
      pathname === "/stock/current" ||
      (isMonthStockPath(pathname) && stockNavSource === "stock-mgt"),
  },
  {
    name: "Category Mgt",
    href: "/categories",
    icon: Tag,
    isActive: (pathname) => pathname.startsWith("/categories"),
  },
  {
    name: "Purchases",
    href: "/purchases",
    icon: ShoppingBag,
    isActive: (pathname) => pathname.startsWith("/purchases"),
  },
  {
    name: "Compare Stock",
    href: "/stock/compare",
    icon: GitCompare,
    isActive: (pathname) => pathname.startsWith("/stock/compare"),
  },
  {
    name: "User Mgt",
    href: "/users",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/users"),
  },
];

export default function Sidebar({ onCollapsedChange }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [stockNavSource, setStockNavSourceState] = useState("dashboard");

  const { authUser, isLoading } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStockNavSourceState(getStockNavSource());
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed") === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCollapsed(saved);
    if (onCollapsedChange) onCollapsedChange(saved);
    setIsMounted(true);
  }, [onCollapsedChange]);

  if (pathname === "/login" || pathname === "/") return null;

  const handleToggleCollapse = () => {
    const nextCollapsedValue = !isCollapsed;
    setIsCollapsed(nextCollapsedValue);
    localStorage.setItem("sidebarCollapsed", String(nextCollapsedValue));
    if (onCollapsedChange) onCollapsedChange(nextCollapsedValue);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  return (
    <aside
      style={{ width: "var(--sidebar-width)" }}
      className={`h-screen bg-[#1a2332] text-white fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <div
        className={`flex items-center p-6 border-b border-gray-700 ${
          !isCollapsed ? "justify-between" : "justify-center"
        }`}
      >
        {!isCollapsed && <h1 className="text-xl font-bold">Stock Mgt</h1>}
        <button
          onClick={handleToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!isCollapsed ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-2 px-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive = isMounted
            ? item.isActive(pathname, stockNavSource)
            : false;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (item.navSource) setStockNavSource(item.navSource);
              }}
              className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                isCollapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-6 h-6 shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="w-full flex flex-col py-4 mt-auto border-t border-gray-700">
        <div
          className={`w-full flex items-center gap-3 mb-6 px-4 ${
            isCollapsed ? "justify-center px-0" : "justify-start"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gray-600 flex justify-center items-center shrink-0">
            {isLoading ? (
              <LoaderCircle size={20} className="animate-spin text-gray-300" />
            ) : (
              <CircleUser className="w-8 h-8 text-gray-300" />
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 break-words">
              {isLoading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : (
                <div>
                  <p className="text-base font-medium">
                    {authUser?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {authUser?.email || ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 space-y-2">
          <Link
            href="/change-password"
            className={`flex items-center gap-3 px-4 py-2 text-gray-400 text-sm rounded-lg ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Change Password" : undefined}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Change Password</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-2 w-full text-left text-gray-300 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-base">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
