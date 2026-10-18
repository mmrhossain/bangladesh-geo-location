import type {
    DatasetCounts,
    EntityType,
    Resource,
} from "@/lib/types";

export interface ResourceConfig {
    value: Resource;
    type: EntityType;
    label: string;
    singular: string;
    countKey: keyof DatasetCounts;
    parentKey: "divisionCode" | "districtCode" | "upazilaCode" | null;
    parentLabel: string;
}

export const RESOURCES: ResourceConfig[] = [
    {
        value: "divisions",
        type: "division",
        label: "Divisions",
        singular: "Division",
        countKey: "divisions",
        parentKey: null,
        parentLabel: "Country",
    },
    {
        value: "districts",
        type: "district",
        label: "Districts",
        singular: "District",
        countKey: "districts",
        parentKey: "divisionCode",
        parentLabel: "Division",
    },
    {
        value: "upazilas",
        type: "upazila",
        label: "Upazilas",
        singular: "Upazila",
        countKey: "upazilas",
        parentKey: "districtCode",
        parentLabel: "District",
    },
    {
        value: "unions",
        type: "union",
        label: "Unions",
        singular: "Union",
        countKey: "unions",
        parentKey: "upazilaCode",
        parentLabel: "Upazila",
    },
    {
        value: "post-offices",
        type: "post-office",
        label: "Post offices",
        singular: "Post office",
        countKey: "postOffices",
        parentKey: "districtCode",
        parentLabel: "District",
    },
];

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
    { value: "division", label: "Division" },
    { value: "district", label: "District" },
    { value: "upazila", label: "Upazila" },
    { value: "union", label: "Union" },
    { value: "post-office", label: "Post office" },
];

export function getResourceConfig(resource: Resource): ResourceConfig {
    return (
        RESOURCES.find((entry) => entry.value === resource) ?? RESOURCES[0]
    );
}

export function getResourceForType(type: EntityType): Resource {
    return (
        RESOURCES.find((entry) => entry.type === type)?.value ?? "divisions"
    );
}

export function getEntityTypeLabel(type: EntityType): string {
    return ENTITY_TYPES.find((entry) => entry.value === type)?.label ?? type;
}
