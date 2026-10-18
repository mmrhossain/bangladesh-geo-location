import type { Metadata } from "next";
import { DatasetView } from "@/components/views/dataset-view";
import {
    fetchDatasetMeta,
} from "@/lib/server-api";

export const metadata: Metadata = {
    title: "Dataset",
};

export const revalidate = 30;

export default async function DatasetPage() {
    const meta = await fetchDatasetMeta();

    return <DatasetView initialMeta={meta} />;
}
