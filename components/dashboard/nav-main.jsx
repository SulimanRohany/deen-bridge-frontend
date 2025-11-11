"use client"
import { IconCirclePlusFilled, IconMail, Icon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"



import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
export function NavMain({
    items,
    activeItem, 
}) {
    // Helper function to determine if an item is active
    const isActive = (itemUrl) => {
        // For dashboard, only match exact URL to prevent it from being active on other pages
        if (itemUrl === '/dashboard/super-admin' || itemUrl === '/dashboard/teacher') {
            const isDashboardActive = activeItem === itemUrl;
            console.log(`Dashboard check: ${itemUrl} === ${activeItem} = ${isDashboardActive}`);
            return isDashboardActive;
        }
        // For other items, match exact URL or if current path starts with the item URL followed by a slash
        const isOtherActive = activeItem === itemUrl || activeItem.startsWith(itemUrl + '/');
        console.log(`Other check: ${itemUrl} vs ${activeItem} = ${isOtherActive}`);
        return isOtherActive;
    };

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <Link href={item.url} className="block">
                            <SidebarMenuButton 
                                tooltip={item.title}
                                className={`sidebar-menu-button ${
                                    isActive(item.url)
                                        ? "sidebar-menu-button-active" 
                                        : "hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                                }`}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
