"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import NotificationBell from "@/components/notifications/NotificationBell"
import NotificationDropdown from "@/components/notifications/NotificationDropdown"

import AuthContext from "@/context/AuthContext"
import { useContext, useState, useEffect, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"

import { useRouter, usePathname } from "next/navigation"




export function SiteHeader() {
	const { userData, loginUser, logoutUser } = useContext(AuthContext)
	const router = useRouter()
	const pathname = usePathname()
	const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
	const notificationBellRef = useRef(null)

	// Function to get page title based on current pathname
	const getPageTitle = () => {
		if (!pathname) return "Dashboard"
		
		// Map routes to titles
		const routeTitles = {
			// Super Admin Routes
			"/dashboard/super-admin": "Dashboard",
			"/dashboard/super-admin/courses": "Classes",
			"/dashboard/super-admin/subjects": "Subjects",
			"/dashboard/super-admin/sessions": "Live Sessions",
			"/dashboard/super-admin/blog": "Blog Management",
			"/dashboard/super-admin/library": "Library",
			"/dashboard/super-admin/custom-requests": "Custom Requests",
			"/dashboard/super-admin/contact-messages": "Contact Messages",
			"/dashboard/super-admin/users": "Users",
			"/dashboard/super-admin/attendance": "Attendance",
			"/dashboard/super-admin/enrollments": "Enrollments",
			"/dashboard/super-admin/reports": "Reports",
			"/dashboard/super-admin/timetable": "Timetable",
			
			// Teacher Routes
			"/dashboard/teacher": "Dashboard",
			"/dashboard/teacher/courses": "My Classes",
			"/dashboard/teacher/sessions": "Live Sessions",
			"/dashboard/teacher/students": "My Students",
			"/dashboard/teacher/attendance": "Attendance",
		}

		// Check for exact match first
		if (routeTitles[pathname]) {
			return routeTitles[pathname]
		}

		// Check for partial matches (for nested routes)
		for (const [route, title] of Object.entries(routeTitles)) {
			if (pathname.startsWith(route + '/')) {
				return title
			}
		}

		// Default fallback
		return "Dashboard"
	}

	// Initialize notifications hook
	const {
		notifications,
		unreadCount,
		loading: notificationsLoading,
		isConnected: notificationsConnected,
		markAsRead,
		markAsUnread,
		markAllAsRead,
		deleteNotification,
		deleteAll,
		requestNotificationPermission
	} = useNotifications(userData?.id)

	// Request notification permission when user logs in
	useEffect(() => {
		if (userData && 'Notification' in window && Notification.permission === 'default') {
			requestNotificationPermission()
		}
	}, [userData, requestNotificationPermission]);

	// Close notification dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (notificationBellRef.current && !notificationBellRef.current.contains(event.target)) {
				setNotificationDropdownOpen(false)
			}
		}

		if (notificationDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [notificationDropdownOpen]);

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">{getPageTitle()}</h1>
				<div className="ml-auto flex items-center gap-2">
					{/* Notification Bell */}
					{userData && (
						<div className="relative" ref={notificationBellRef}>
							<NotificationBell
								unreadCount={unreadCount}
								isOpen={notificationDropdownOpen}
								onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
							/>
							
							{notificationDropdownOpen && (
								<NotificationDropdown
									notifications={notifications}
									loading={notificationsLoading}
									isConnected={notificationsConnected}
									onMarkAsRead={markAsRead}
									onMarkAsUnread={markAsUnread}
									onMarkAllAsRead={markAllAsRead}
									onDelete={deleteNotification}
									onDeleteAll={deleteAll}
									onClose={() => setNotificationDropdownOpen(false)}
									triggerRef={notificationBellRef}
								/>
							)}
						</div>
					)}

					<ThemeToggle />
					{userData ? (
						<>
							{/* <span>Welcome, {userData.full_name}</span> */}
							{/* <Button onClick={logoutUser}>Logout</Button> */}
						</>
					) : (
						<>
							<Button onClick={() => router.push("/login")}>Login</Button>
							<Button onClick={() => router.push("/signup")}>Signup</Button>
						</>
					)}
				</div>
			</div>
		</header>
	)
}
