import type { Metadata } from "next";
import { OverviewView } from "@/components/views/overview-view";
import {
    fetchDatasetMeta,
    fetchReadiness,
} from "@/lib/server-api";

export const metadata: Metadata = {
    title: "Overview",
};

export const revalidate = 30;

export default async function HomePage() {
    const [meta, readiness] = await Promise.all([
        fetchDatasetMeta(),
        fetchReadiness(),
    ]);

    return (
        <OverviewView
            initialMeta={meta}
            initialReadiness={readiness}
        />
    );
}
