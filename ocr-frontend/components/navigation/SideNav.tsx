"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  FileCheck,
  BarChart3,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Button from "../ui/Button";
import { useSideNav } from "@/context/SideNavContext";

interface SideNavProps {
  className?: string;
  onNavigate?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ className = "", onNavigate }) => {
  const pathname = usePathname();
  const { isOpen, setOpen } = useSideNav();

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: "/history",
      label: "History",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    { 
      href: "/settings", 
      label: "Settings", 
      icon: <Settings className="w-5 h-5" /> 
    },
  ];

  // const handleLogout = async () => {
  //   await signOut({ callbackUrl: "/login" });
  //   toast.success("Logged out successfully");
  //   onNavigate?.();
  // };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-gray-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:shadow-none shadow-2xl border-r border-gray-800/50 ${className} z-40`}
    >
      {/* Top Section */}
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-gray-800/50">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-all duration-200 hover:scale-105"
          >
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                OCR Suite
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Document Analysis
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-4">
            Navigation
          </div>
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                onNavigate?.();
                setOpen(false);
              }}
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActiveLink(href)
                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-500/30"
                  : "hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`transition-transform duration-200 ${
                  isActiveLink(href) 
                    ? "scale-110" 
                    : "group-hover:scale-110"
                }`}>
                  {icon}
                </div>
                <span className="font-medium">{label}</span>
              </div>
              {isActiveLink(href) && (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Section & Logout */}
        <div className="px-4 py-4 border-t border-gray-800/50 space-y-3">
          {/* User Profile Section */}
          <div className="px-3 py-2 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">User Name</p>
                <p className="text-xs text-gray-500 truncate">user@email.com</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 cursor-pointer font-medium"
            // onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;