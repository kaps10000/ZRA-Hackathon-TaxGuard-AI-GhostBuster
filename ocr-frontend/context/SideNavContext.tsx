"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SideNavContextType = {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

export const SideNavProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const setOpen = (open: boolean) => setIsOpen(open);

  return (
    <SideNavContext.Provider value={{ isOpen, toggle, setOpen }}>
      {children}
    </SideNavContext.Provider>
  );
};

export const useSideNav = () => {
  const context = useContext(SideNavContext);
  if (!context) {
    throw new Error("useSideNav must be used within a SideNavProvider");
  }
  return context;
};
