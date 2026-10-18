export type Resource =
    | "divisions"
    | "districts"
    | "upazilas"
    | "unions"
    | "post-offices";

export type EntityType =
    | "division"
    | "district"
    | "upazila"
    | "union"
    | "post-office";

export interface GeoEntity {
    code: string;
    name: string;
    bn_name: string;
    slug?: string;
    aliases?: string[];
    iso_code?: string | null;
    divisionCode?: string | null;
    districtCode?: string | null;
    upazilaCode?: string | null;
    deprecated_at?: string | null;
    dataset_version?: string;
}

export interface SearchResult extends GeoEntity {
    type: EntityType;
}

export interface DatasetCounts {
    divisions: number;
    districts: number;
    upazilas: number;
    unions: number;
    postOffices: number;
}

export interface DatasetMeta {
    datasetVersion: string;
    importedAt: string | null;
    loadedAt: string | null;
    note: string | null;
    counts: DatasetCounts;
}

export interface ImportSummary {
    datasetVersion: string;
    importedAt: string;
    note: string | null;
    counts: DatasetCounts;
}

export interface PaginationMeta {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
}

export interface ApiEnvelope<T> {
    status: "success";
    data: T;
    meta?: PaginationMeta | null;
}

export interface Paginated<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface HierarchyNode extends GeoEntity {
    districts?: HierarchyNode[];
    upazilas?: HierarchyNode[];
    unions?: HierarchyNode[];
}

export interface HierarchyResult {
    depth: number;
    divisions: HierarchyNode[];
}

export interface ReadinessSnapshot {
    ready: boolean;
    loadedAt: string | null;
    datasetVersion?: string;
    counts: DatasetCounts;
}

export interface ReadinessResponse {
    status: "ready" | "not_ready";
    snapshot: ReadinessSnapshot;
}

export interface ImportPayload {
    datasetVersion?: string;
    note?: string;
    divisions?: unknown[];
    districts?: unknown[];
    upazilas?: unknown[];
    unions?: unknown[];
    postOffices?: unknown[];
}

export interface AdminUpdatePayload {
    name?: string;
    bn_name?: string;
    aliases?: string[];
    iso_code?: string | null;
}
