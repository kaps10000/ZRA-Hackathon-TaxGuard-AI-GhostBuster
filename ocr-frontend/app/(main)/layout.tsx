"use client";
import type { ReactNode } from "react";
import SideNav from "@/components/navigation/SideNav";
import { useSideNav } from "@/context/SideNavContext";
import NavBar from "@/components/navigation/NavBar";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isOpen, setOpen } = useSideNav();
  return (
    <section className="min-h-screen">
            <NavBar />

      <SideNav />
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <main className="p-6 lg:pl-64 mt-20">{children}</main>
    </section>
  );
}

