"use client"

import * as React from "react"
import { Icon } from "@tabler/icons-react"
import Link from "next/link"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
    items,
    activeItem,
    ...props
}) {
    return (
        <SidebarGroup {...props}>
        <SidebarGroupContent>
            <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="block">
                    <SidebarMenuButton
                        className={`sidebar-menu-button ${
                            activeItem === item.url 
                                ? "sidebar-menu-button-active" 
                                : "hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
                        }`}
                    >
                        <item.icon />
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
