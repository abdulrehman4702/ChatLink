import React, { createContext, useContext, useState, useEffect } from "react";

interface MobileContextType {
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Create default values for better Fast Refresh compatibility
const defaultContextValue: MobileContextType = {
  isMobile: false,
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
};

const MobileContext = createContext<MobileContextType>(defaultContextValue);

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context;
};

interface MobileProviderProps {
  children: React.ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); // Always show sidebar on desktop
      } else {
        setSidebarOpen(false); // Hide sidebar on mobile by default
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </MobileContext.Provider>
  );
};
