import type {
    ApiEnvelope,
    DatasetMeta,
    HierarchyResult,
    PaginationMeta,
    ReadinessResponse,
    Resource,
    GeoEntity,
} from "@/lib/types";

const API_BASE_URL = (
    process.env.API_PROXY_URL ?? "http://127.0.0.1:4000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 2_500;

export const DATASET_REVALIDATE_SECONDS = 30;
export const HIERARCHY_REVALIDATE_SECONDS = 60;
export const RESOURCE_REVALIDATE_SECONDS = 60;

type CacheOptions = {
    revalidate: number;
    tags: string[];
};

async function request<T>(
    path: string,
    { revalidate, tags }: CacheOptions
): Promise<T | null> {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            next: { revalidate, tags },
        });

        if (!response.ok && !path.startsWith("/ready")) {
            return null;
        }

        return (await response.json()) as T;
    } catch {
        return null;
    }
}

function buildQuery(
    values: Record<string, string | number | boolean | null | undefined>
): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === "") {
            continue;
        }

        params.set(key, String(value));
    }

    const query = params.toString();
    return query ? `?${query}` : "";
}

export async function fetchDatasetMeta(): Promise<DatasetMeta | null> {
    const payload = await request<ApiEnvelope<DatasetMeta>>(
        "/api/v1/meta/dataset",
        {
            revalidate: DATASET_REVALIDATE_SECONDS,
            tags: ["dataset", "dataset-meta"],
        }
    );

    return payload?.data ?? null;
}

export async function fetchReadiness(): Promise<ReadinessResponse | null> {
    return request<ReadinessResponse>("/ready", {
        revalidate: DATASET_REVALIDATE_SECONDS,
        tags: ["dataset", "readiness"],
    });
}

export async function fetchHierarchy(
    depth = 2,
    includeDeprecated = false
): Promise<HierarchyResult | null> {
    const query = buildQuery({
        depth,
        includeDeprecated: includeDeprecated ? "true" : undefined,
    });
    const payload = await request<ApiEnvelope<HierarchyResult>>(
        `/api/v1/hierarchy${query}`,
        {
            revalidate: HIERARCHY_REVALIDATE_SECONDS,
            tags: ["hierarchy", `hierarchy:${depth}`],
        }
    );

    return payload?.data ?? null;
}

export async function fetchResourcePage(
    resource: Resource,
    options: {
        limit?: number;
        cursor?: string | null;
        includeDeprecated?: boolean;
    } = {}
): Promise<{ items: GeoEntity[]; meta: PaginationMeta | null } | null> {
    const query = buildQuery({
        limit: options.limit ?? 50,
        cursor: options.cursor,
        includeDeprecated: options.includeDeprecated ? "true" : undefined,
    });
    const payload = await request<ApiEnvelope<GeoEntity[]>>(
        `/api/v1/${resource}${query}`,
        {
            revalidate: RESOURCE_REVALIDATE_SECONDS,
            tags: ["resources", `resource:${resource}`],
        }
    );

    if (!payload) {
        return null;
    }

    return {
        items: payload.data,
        meta: payload.meta ?? null,
    };
}
