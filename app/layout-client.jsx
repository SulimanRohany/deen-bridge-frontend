"use client";

import { Toaster } from "sonner";
import "./globals.css";

import { AppSidebar } from "../components/dashboard/app-sidebar";
import { SiteHeader } from "../components/dashboard/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

import { useContext } from "react";
import AuthContext from "@/context/AuthContext";
import HeaderNav from "@/components/header-nav";
import Footer from "@/components/footer";

function AppLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isLiveSessionPage = pathname?.includes("/sessions/") && pathname?.endsWith("/join");
  const isStudentHomepage = pathname === "/";
  const { userData } = useContext(AuthContext);

  if (isAuthPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full">{children}</div>
      </div>
    );
  }

  // Full-screen layout for live session join page
  if (isLiveSessionPage) {
    return (
      <>
        {children}
        <Toaster position="top-center" richColors expand visibleToasts={1} />
      </>
    );
  }

  return userData?.role === "super_admin" || userData?.role === "teacher" ? (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col">
              <div className="flex flex-col py-4 md:py-6">
                {children}
                <Toaster position="top-center" richColors expand visibleToasts={1} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  ) : (
      <>
        <HeaderNav />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <div className={`flex flex-col ${isStudentHomepage ? '' : ''}`}>
              {children}
              <Toaster position="top-center" richColors expand visibleToasts={1} />
            </div>
          </div>
        </div>
        <Footer />
      </>
  );
}

export default function RootLayoutClient({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppLayout>{children}</AppLayout>
      </AuthProvider>
    </ThemeProvider>
  );
}

