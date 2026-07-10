"use client";
import { useState } from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import { SidebarProvider } from "../components/SidebarContext";

const pageTitles = {
  "/admin": "Overview",
  "/admin/users": "Users",
  "/admin/credits": "Credits",
  "/admin/ai-tools": "AI Tools",
  "/admin/models": "Models",
  "/admin/generations": "Generations",
  "/admin/clipping": "Clipping Jobs",
  "/admin/ugc": "UGC Engine",
  "/admin/hooks": "Hook Generator",
  "/admin/templates": "Templates",
  "/admin/plans": "Plans & Pricing",
  "/admin/payments": "Payments",
  "/admin/affiliates": "Affiliates",
  "/admin/withdrawal-requests": "Withdrawal Requests",
  "/admin/support": "Support",
  "/admin/logs": "Logs",
  "/admin/settings": "Settings",
};

export default function AdminLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden bg-background text-white flex">
        <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar setMobileOpen={setMobileSidebarOpen} />
          <div className="flex-1 overflow-y-auto smooth-scroll custom-scrollbar h-full bg-background">
            <div className="px-4 md:px-6 py-4 md:py-5 max-w-[1600px] mx-auto min-h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
