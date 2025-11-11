"use client";

import { Toaster } from "sonner";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { metadata } from "./metadata";
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
// import StudentHeaderNav from "../components/ui/StudentHeaderNav";
// import StudentHeaderNav from "@/components/header-nav";
// import HeaderNav from "@/components/header-nav";
// import HeaderNav  from "@/components/header-nav";
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
            {/* Remove padding for homepage (both authenticated students and unauthenticated users) to allow full-width design */}
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
      </body>
    </html>
  );
}
