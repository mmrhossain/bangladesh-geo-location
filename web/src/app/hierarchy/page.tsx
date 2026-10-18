import type { Metadata } from "next";
import { HierarchyView } from "@/components/views/hierarchy-view";
import {
    fetchHierarchy,
} from "@/lib/server-api";

export const metadata: Metadata = {
    title: "Hierarchy",
};

export const revalidate = 60;

export default async function HierarchyPage() {
    const initialHierarchy = await fetchHierarchy(2);

    return <HierarchyView initialHierarchy={initialHierarchy} />;
}
