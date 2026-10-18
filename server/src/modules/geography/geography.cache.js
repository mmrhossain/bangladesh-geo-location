import env from "../../shared/config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
    cacheEntityGauge,
    cacheReadyGauge,
} from "../../shared/observability/metrics.js";
import { normalizeText, searchTokens } from "../../shared/utils/text.js";
import { loadAllLean } from "./geography.repository.js";

const NAME_LOCALE = "en";

const state = {
    ready: false,
    loadedAt: null,
    meta: {
        version: env.DATASET_VERSION,
        importedAt: null,
        note: null,
        counts: {
            divisions: 0,
            districts: 0,
            upazilas: 0,
            unions: 0,
            postOffices: 0,
        },
    },
    maps: {
        divisions: new Map(),
        districts: new Map(),
        upazilas: new Map(),
        unions: new Map(),
        postOffices: new Map(),
    },
    lists: {
        divisions: [],
        districts: [],
        upazilas: [],
        unions: [],
        postOffices: [],
    },
    children: {
        districtsByDivision: new Map(),
        upazilasByDistrict: new Map(),
        unionsByUpazila: new Map(),
        postOfficesByDistrict: new Map(),
        postOfficesByUpazila: new Map(),
    },
    searchIndex: [],
};

let loadingPromise = null;

function sortByName(items) {
    return items.sort(
        (left, right) =>
            left.name.localeCompare(right.name, NAME_LOCALE) ||
            left.code.localeCompare(right.code, NAME_LOCALE)
    );
}

function groupCodes(items, keySelector) {
    const grouped = new Map();

    for (const item of items) {
        const key = keySelector(item);
        if (!key) {
            continue;
        }

        const bucket = grouped.get(key);
        if (bucket) {
            bucket.push(item.code);
        } else {
            grouped.set(key, [item.code]);
        }
    }

    return grouped;
}

const COLLECTION_TO_TYPE = {
    divisions: "division",
    districts: "district",
    upazilas: "upazila",
    unions: "union",
    postOffices: "post-office",
};

function buildSearchIndex(collections) {
    const index = [];

    for (const [collection, items] of Object.entries(collections)) {
        const type = COLLECTION_TO_TYPE[collection];
        for (const entity of items) {
            index.push({
                type,
                code: entity.code,
                name: entity.name,
                text: normalizeText(
                    [
                        entity.code,
                        entity.name,
                        entity.bn_name,
                        entity.slug,
                        ...(entity.aliases || []),
                    ].join(" ")
                ),
                deprecated: Boolean(entity.deprecated_at),
                entity,
            });
        }
    }

    return index;
}

async function buildSnapshot() {
    const raw = await loadAllLean();

    const divisionById = new Map(
        raw.divisions.map((doc) => [String(doc._id), doc])
    );
    const districtById = new Map(
        raw.districts.map((doc) => [String(doc._id), doc])
    );
    const upazilaById = new Map(
        raw.upazilas.map((doc) => [String(doc._id), doc])
    );

    const divisions = sortByName(
        raw.divisions.map((doc) => ({
            code: doc.code,
            name: doc.name,
            bn_name: doc.bn_name,
            slug: doc.slug,
            iso_code: doc.iso_code ?? null,
            aliases: doc.aliases || [],
            deprecated_at: doc.deprecated_at ?? null,
            dataset_version: doc.dataset_version,
        }))
    );

    const districts = sortByName(
        raw.districts.map((doc) => {
            const division = divisionById.get(String(doc.division));
            return {
                code: doc.code,
                name: doc.name,
                bn_name: doc.bn_name,
                slug: doc.slug,
                divisionCode: division?.code ?? null,
                aliases: doc.aliases || [],
                deprecated_at: doc.deprecated_at ?? null,
                dataset_version: doc.dataset_version,
            };
        })
    );

    const upazilas = sortByName(
        raw.upazilas.map((doc) => {
            const district = districtById.get(String(doc.district));
            const division = district
                ? divisionById.get(String(district.division))
                : null;
            return {
                code: doc.code,
                name: doc.name,
                bn_name: doc.bn_name,
                slug: doc.slug,
                districtCode: district?.code ?? null,
                divisionCode: division?.code ?? null,
                aliases: doc.aliases || [],
                deprecated_at: doc.deprecated_at ?? null,
                dataset_version: doc.dataset_version,
            };
        })
    );

    const unions = sortByName(
        raw.unions.map((doc) => {
            const upazila = upazilaById.get(String(doc.upazila));
            const district = upazila
                ? districtById.get(String(upazila.district))
                : null;
            const division = district
                ? divisionById.get(String(district.division))
                : null;
            return {
                code: doc.code,
                name: doc.name,
                bn_name: doc.bn_name,
                slug: doc.slug,
                upazilaCode: upazila?.code ?? null,
                districtCode: district?.code ?? null,
                divisionCode: division?.code ?? null,
                aliases: doc.aliases || [],
                deprecated_at: doc.deprecated_at ?? null,
                dataset_version: doc.dataset_version,
            };
        })
    );

    const postOffices = sortByName(
        raw.postOffices.map((doc) => {
            const district = districtById.get(String(doc.district));
            const upazila = doc.upazila
                ? upazilaById.get(String(doc.upazila))
                : null;
            const division = district
                ? divisionById.get(String(district.division))
                : null;
            return {
                code: doc.code,
                name: doc.name,
                bn_name: doc.bn_name,
                slug: doc.slug,
                districtCode: district?.code ?? null,
                upazilaCode: upazila?.code ?? null,
                divisionCode: division?.code ?? null,
                aliases: doc.aliases || [],
                deprecated_at: doc.deprecated_at ?? null,
                dataset_version: doc.dataset_version,
            };
        })
    );

    const collections = { divisions, districts, upazilas, unions, postOffices };
    const counts = {
        divisions: divisions.length,
        districts: districts.length,
        upazilas: upazilas.length,
        unions: unions.length,
        postOffices: postOffices.length,
    };

    state.maps.divisions = new Map(
        divisions.map((entity) => [entity.code, entity])
    );
    state.maps.districts = new Map(
        districts.map((entity) => [entity.code, entity])
    );
    state.maps.upazilas = new Map(
        upazilas.map((entity) => [entity.code, entity])
    );
    state.maps.unions = new Map(unions.map((entity) => [entity.code, entity]));
    state.maps.postOffices = new Map(
        postOffices.map((entity) => [entity.code, entity])
    );

    state.lists = collections;
    state.children.districtsByDivision = groupCodes(
        districts,
        (item) => item.divisionCode
    );
    state.children.upazilasByDistrict = groupCodes(
        upazilas,
        (item) => item.districtCode
    );
    state.children.unionsByUpazila = groupCodes(
        unions,
        (item) => item.upazilaCode
    );
    state.children.postOfficesByDistrict = groupCodes(
        postOffices,
        (item) => item.districtCode
    );
    state.children.postOfficesByUpazila = groupCodes(
        postOffices,
        (item) => item.upazilaCode
    );
    state.searchIndex = buildSearchIndex(collections);

    state.meta = {
        version: raw.meta?.version ?? env.DATASET_VERSION,
        importedAt: raw.meta?.imported_at ?? null,
        note: raw.meta?.note ?? null,
        counts,
    };
    state.loadedAt = new Date().toISOString();
    state.ready = true;
    cacheReadyGauge.set(1);

    for (const [entity, count] of Object.entries(counts)) {
        cacheEntityGauge.set({ entity }, count);
    }

    return state;
}

export function loadSnapshot() {
    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = buildSnapshot().finally(() => {
        loadingPromise = null;
    });

    return loadingPromise;
}

export function invalidateSnapshot() {
    return loadSnapshot();
}

export function getSnapshot() {
    if (!state.ready) {
        throw AppError.serviceUnavailable(
            "GEO_CACHE_NOT_READY",
            "Geography data is not loaded yet"
        );
    }

    return state;
}

export function getSnapshotHealth() {
    const total = Object.values(state.meta.counts).reduce(
        (sum, count) => sum + count,
        0
    );

    return {
        ready: state.ready && total > 0,
        loadedAt: state.loadedAt,
        datasetVersion: state.meta.version,
        counts: state.meta.counts,
    };
}

export function searchSnapshot({
    q,
    type,
    page,
    limit,
    includeDeprecated,
}) {
    const snapshot = getSnapshot();
    const normalizedQuery = normalizeText(q);
    const tokens = searchTokens(q);
    const normalizedCode = q.trim().toUpperCase();
    const matches = [];

    for (const entry of snapshot.searchIndex) {
        if (!includeDeprecated && entry.deprecated) {
            continue;
        }

        if (type && entry.type !== type) {
            continue;
        }

        if (!tokens.every((token) => entry.text.includes(token))) {
            continue;
        }

        let score = 0;
        const normalizedName = normalizeText(entry.name);

        if (entry.code === normalizedCode) {
            score += 100;
        } else if (entry.code.includes(normalizedCode)) {
            score += 10;
        }

        if (normalizedName === normalizedQuery) {
            score += 50;
        } else if (normalizedName.startsWith(normalizedQuery)) {
            score += 25;
        }

        matches.push({ entry, score });
    }

    matches.sort(
        (left, right) =>
            right.score - left.score ||
            left.entry.name.localeCompare(right.entry.name)
    );

    const total = matches.length;
    const start = (page - 1) * limit;
    const items = matches
        .slice(start, start + limit)
        .map(({ entry }) => ({ type: entry.type, ...entry.entity }));

    return {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
    };
}

export function filterByDeprecated(items, includeDeprecated) {
    if (includeDeprecated) {
        return items;
    }

    return items.filter((item) => !item.deprecated_at);
}

export default {
    loadSnapshot,
    invalidateSnapshot,
    getSnapshot,
    getSnapshotHealth,
    searchSnapshot,
    filterByDeprecated,
};
