"use client"

import * as React from "react"
import {
    IconCamera,
    IconChartBar,
    IconDashboard,
    IconDatabase,
    IconFileAi,
    IconFileDescription,
    IconFileWord,
    IconFolder,
    IconHelp,
    IconInnerShadowTop,
    IconListDetails,
    IconReport,
    IconSearch,
    IconSettings,
    IconUsers,
    IconBook,
    IconBooks,
    IconChalkboardTeacher,
    IconLivePhoto,
    IconArticle,
    IconCreditCard,
    IconUserPentagon,
    IconBlockquote,
    IconSparkles,
    IconClipboardCheck,
    IconMessage,
} from "@tabler/icons-react"

// import { NavDocuments } from "./nav-documents"
import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
// import { NavSecondary } from "../nav-secondary"
// import { NavUser } from "../nav-user"
import { NavUser } from "./nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { useContext } from "react"
import AuthContext from "@/context/AuthContext"

const superAdminData = {
    navMain: [
        {
        title: "Dashboard",
        url: "/dashboard/super-admin",
        icon: IconDashboard,
        },
        {
        title: "Classes",
        url: "/dashboard/super-admin/courses",
        icon: IconBooks,
        },
        {
        title: "Subjects",
        url: "/dashboard/super-admin/subjects",
        // icon: IconChartBar,
        icon: IconBook,
        },
        {
        title: "Live Sessions",
        url: "/dashboard/super-admin/sessions",
        icon: IconLivePhoto,
        },
        {
        title: "Blog Management",
        url: "/dashboard/super-admin/blog",
        icon: IconBlockquote,
        },
        {
        title: "Library",
        url: "/dashboard/super-admin/library",
        icon: IconFolder,
        },
        {
        title: "Communications",
        url: "/dashboard/super-admin/communications",
        icon: IconMessage,
        },
    ],
    documents: [
        {
        name: "Users",
        url: "/dashboard/super-admin/users",
        icon: IconUsers,
        },
        {
        name: "Attendance",
        url: "/dashboard/super-admin/attendance",
        icon: IconUserPentagon,
        },
        {
        name: "Enrollments",
        url: "/dashboard/super-admin/enrollments",
        icon: IconCreditCard,
        },
    ],
}

const teacherData = {
    navMain: [
        {
        title: "Dashboard",
        url: "/dashboard/teacher",
        icon: IconDashboard,
        },
        {
        title: "My Classes",
        url: "/dashboard/teacher/courses",
        icon: IconBooks,
        },
        {
        title: "Live Sessions",
        url: "/dashboard/teacher/sessions",
        icon: IconLivePhoto,
        },
        {
        title: "My Students",
        url: "/dashboard/teacher/students",
        icon: IconUsers,
        },
    ],
    documents: [
        {
        name: "Attendance",
        url: "/dashboard/teacher/attendance",
        icon: IconClipboardCheck,
        },
    ],
}

export function AppSidebar({ ...props }) {
    // Use Next.js usePathname hook for real-time path updates
    const pathname = usePathname()
    const { userData } = useContext(AuthContext)
    
    // Determine which data to use based on user role
    const data = userData?.role === "teacher" ? teacherData : superAdminData

    return (
        <Sidebar collapsible="offcanvas" {...props}>
        <SidebarContent>
            <NavMain items={data.navMain} activeItem={pathname}/>
            <NavDocuments items={data.documents} activeItem={pathname}/>
        </SidebarContent>
        <SidebarFooter>
            <NavUser />
        </SidebarFooter>
        </Sidebar>
    )
}
