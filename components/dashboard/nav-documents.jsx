"use client"

import {
    IconDots,
    IconFolder,
    IconShare3,
    IconTrash,
    Icon,
} from "@tabler/icons-react"
import Link from "next/link"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavDocuments({
    items,
    activeItem, 
}) {
    const { isMobile } = useSidebar()

    // Helper function to determine if an item is active
    const isActive = (itemUrl) => {
        // Match exact URL or if current path starts with the item URL followed by a slash
        return activeItem === itemUrl || activeItem.startsWith(itemUrl + '/');
    };

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Documents</SidebarGroupLabel>
        <SidebarMenu>
            {items.map((item) => (
            <SidebarMenuItem key={item.name}>
                <Link href={item.url} className="block">
                    <SidebarMenuButton 
                        className={`sidebar-menu-button ${
                            isActive(item.url)
                                ? "sidebar-menu-button-active" 
                                : "hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                        }`}
                    >
                        <item.icon />
                        <span>{item.name}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            ))}
        </SidebarMenu>
        </SidebarGroup>
    )
}
