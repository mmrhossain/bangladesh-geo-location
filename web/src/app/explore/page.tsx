import type { Metadata } from "next";
import { ExploreView } from "@/components/views/explore-view";
import {
    fetchDatasetMeta,
    fetchResourcePage,
} from "@/lib/server-api";

export const metadata: Metadata = {
    title: "Explorer",
};

export const revalidate = 60;

export default async function ExplorePage() {
    const [initialMeta, initialDivisions] = await Promise.all([
        fetchDatasetMeta(),
        fetchResourcePage("divisions", { limit: 50 }),
    ]);

    return (
        <ExploreView
            initialMeta={initialMeta}
            initialDivisions={initialDivisions}
        />
    );
}
