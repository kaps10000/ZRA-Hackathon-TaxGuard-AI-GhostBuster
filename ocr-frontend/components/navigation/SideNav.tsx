"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard as Dashboard,
  PlusCircle,
  KeyRound,
  Shield,
  Settings,
  LogOut,
  Lock,
  
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import Button from "../ui/Button";
import { useSideNav } from "@/context/SideNavContext";

interface SideNavProps {
  className?: string;
  onNavigate?: () => void; // useful on mobile to close after navigation
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
      icon: <Dashboard className="w-5 h-5" />,
    },
    { href: "/vault", label: "Vault", icon: <Lock className="w-5 h-5" /> },
    {
      href: "/password-generator",
      label: "Password Generator",
      icon: <KeyRound className="w-5 h-5" />,
    },
    {
      href: "/security-audit",
      label: "Security Audit",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    toast.success("Logged out successfully");
    onNavigate?.();
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-60 bg-gray-900 text-gray-200 flex flex-col justify-between transform transition-transform lg:shadow-none shadow-xl lg:border-r lg:border-gray-800 ${className} z-40`}
    >
      {/* Top Section */}
      <div className="pb-5 lg:border-t-0 border-t border-gray-700">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6 text-xl font-bold border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xl sm:text-2xl cursor-pointer">
            <Shield size={26} />
            <Link href="/">Fortress Key</Link>
          </h3>
        </div>

        {/* Nav Links */}
        <nav className="mt-10 flex flex-col space-y-4">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-6 py-2 rounded-md transition ${
                isActiveLink(href)
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "hover:bg-gray-800"
              }`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="w-full flex flex-col items-center mb-6 px-6 border-t border-gray-700 pt-4">
        <Button
          className="w-[70%] flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 rounded-md transition cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SideNav;
