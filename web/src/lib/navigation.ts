import type { ComponentType, SVGProps } from "react";
import {
    AdminIcon,
    DatasetIcon,
    ExploreIcon,
    HierarchyIcon,
    OverviewIcon,
    SearchIcon,
} from "@/components/icons";

export type NavItem = {
    href: string;
    label: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const NAV_ITEMS: NavItem[] = [
    {
        href: "/",
        label: "Overview",
        description: "Dataset health and coverage",
        icon: OverviewIcon,
    },
    {
        href: "/explore",
        label: "Explorer",
        description: "Browse every administrative level",
        icon: ExploreIcon,
    },
    {
        href: "/search",
        label: "Search",
        description: "Find places in English or Bangla",
        icon: SearchIcon,
    },
    {
        href: "/hierarchy",
        label: "Hierarchy",
        description: "Drill down the administrative tree",
        icon: HierarchyIcon,
    },
    {
        href: "/dataset",
        label: "Dataset",
        description: "Dataset versions and API",
        icon: DatasetIcon,
    },
    {
        href: "/admin",
        label: "Admin",
        description: "Import and maintain records",
        icon: AdminIcon,
    },
];

export function isNavItemActive(pathname: string, href: string): boolean {
    if (href === "/") {
        return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
}
