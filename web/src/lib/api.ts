import type {
    AdminUpdatePayload,
    ApiEnvelope,
    DatasetMeta,
    EntityType,
    GeoEntity,
    HierarchyResult,
    ImportPayload,
    ImportSummary,
    Paginated,
    PaginationMeta,
    ReadinessResponse,
    Resource,
    SearchResult,
} from "@/lib/types";

interface ApiErrorPayload {
    status?: string;
    code?: string;
    message?: string;
    details?: unknown;
}

interface RequestOptions {
    signal?: AbortSignal;
}

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details: unknown;

    constructor(
        message: string,
        options: { code: string; status: number; details?: unknown }
    ) {
        super(message);
        this.name = "ApiError";
        this.code = options.code;
        this.status = options.status;
        this.details = options.details;
    }
}

async function request<T>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;

    try {
        response = await fetch(path, {
            ...init,
            headers,
            cache: "no-store",
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }

        throw new ApiError("Cannot reach the API. Is the service running?", {
            code: "NETWORK_ERROR",
            status: 0,
        });
    }

    const text = await response.text();
    let payload: unknown = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            if (response.ok) {
                throw new ApiError("The API returned an invalid response.", {
                    code: "INVALID_RESPONSE",
                    status: response.status,
                });
            }
        }
    }

    if (!response.ok) {
        const body = payload as ApiErrorPayload | null;

        throw new ApiError(
            body?.message ?? `Request failed with status ${response.status}`,
            {
                code: body?.code ?? "REQUEST_FAILED",
                status: response.status,
                details: body?.details,
            }
        );
    }

    return payload as T;
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

export function describeError(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong.";
}

export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

export async function getDatasetMeta(
    options: RequestOptions = {}
): Promise<DatasetMeta> {
    const payload = await request<ApiEnvelope<DatasetMeta>>(
        "/api/v1/meta/dataset",
        { signal: options.signal }
    );

    return payload.data;
}

export async function getReadiness(
    options: RequestOptions = {}
): Promise<ReadinessResponse> {
    let response: Response;

    try {
        response = await fetch("/ready", {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: options.signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }

        throw new ApiError("Cannot reach the API. Is the service running?", {
            code: "NETWORK_ERROR",
            status: 0,
        });
    }

    const payload = (await response
        .json()
        .catch(() => null)) as ReadinessResponse | null;

    if (payload && payload.snapshot) {
        return payload;
    }

    throw new ApiError(
        response.ok
            ? "The readiness endpoint returned an unexpected response."
            : `Readiness check failed with status ${response.status}`,
        { code: "READINESS_FAILED", status: response.status }
    );
}

export async function listResource(
    resource: Resource,
    options: RequestOptions & {
        limit?: number;
        cursor?: string | null;
        includeDeprecated?: boolean;
    } = {}
): Promise<{ items: GeoEntity[]; meta: PaginationMeta | null }> {
    const query = buildQuery({
        limit: options.limit,
        cursor: options.cursor,
        includeDeprecated: options.includeDeprecated ? "true" : undefined,
    });

    const payload = await request<ApiEnvelope<GeoEntity[]>>(
        `/api/v1/${resource}${query}`,
        { signal: options.signal }
    );

    return {
        items: payload.data,
        meta: payload.meta ?? null,
    };
}

export async function getEntity(
    resource: Resource,
    code: string,
    options: RequestOptions = {}
): Promise<GeoEntity> {
    const payload = await request<ApiEnvelope<GeoEntity>>(
        `/api/v1/${resource}/${encodeURIComponent(code)}`,
        { signal: options.signal }
    );

    return payload.data;
}

export async function searchEntities(
    options: RequestOptions & {
        q: string;
        type?: EntityType | "";
        page?: number;
        limit?: number;
        includeDeprecated?: boolean;
    }
): Promise<Paginated<SearchResult>> {
    const query = buildQuery({
        q: options.q,
        type: options.type,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
        includeDeprecated: options.includeDeprecated ? "true" : undefined,
    });

    const payload = await request<ApiEnvelope<Paginated<SearchResult>>>(
        `/api/v1/search${query}`,
        { signal: options.signal }
    );

    return payload.data;
}

export async function getHierarchy(
    options: RequestOptions & {
        depth?: number;
        includeDeprecated?: boolean;
    } = {}
): Promise<HierarchyResult> {
    const query = buildQuery({
        depth: options.depth ?? 2,
        includeDeprecated: options.includeDeprecated ? "true" : undefined,
    });

    const payload = await request<ApiEnvelope<HierarchyResult>>(
        `/api/v1/hierarchy${query}`,
        { signal: options.signal }
    );

    return payload.data;
}

export async function adminImport(
    payload: ImportPayload,
    apiKey: string
): Promise<ImportSummary> {
    const result = await request<ApiEnvelope<ImportSummary>>(
        "/api/v1/admin/import",
        {
            method: "POST",
            headers: { "x-api-key": apiKey },
            body: JSON.stringify(payload),
        }
    );

    return result.data;
}

export async function adminUpdate(
    resource: Resource,
    code: string,
    payload: AdminUpdatePayload,
    apiKey: string
): Promise<GeoEntity> {
    const result = await request<ApiEnvelope<GeoEntity>>(
        `/api/v1/admin/${resource}/${encodeURIComponent(code)}`,
        {
            method: "PATCH",
            headers: { "x-api-key": apiKey },
            body: JSON.stringify(payload),
        }
    );

    return result.data;
}

export async function adminDeprecate(
    resource: Resource,
    code: string,
    deprecated: boolean,
    apiKey: string
): Promise<GeoEntity> {
    const result = await request<ApiEnvelope<GeoEntity>>(
        `/api/v1/admin/${resource}/${encodeURIComponent(code)}/deprecate`,
        {
            method: "POST",
            headers: { "x-api-key": apiKey },
            body: JSON.stringify({ deprecated }),
        }
    );

    return result.data;
}
