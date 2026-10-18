import {
    filterByDeprecated,
    getSnapshot,
    searchSnapshot,
} from "./geography.cache.js";
import { AppError } from "../../shared/errors/AppError.js";

function resolveCodes(map, codes, includeDeprecated) {
    const items = (codes || [])
        .map((code) => map.get(code))
        .filter(Boolean);

    return filterByDeprecated(items, includeDeprecated);
}

function requireEntity(map, code, { code: errorCode, label }) {
    const entity = map.get(code);

    if (!entity) {
        throw AppError.notFound(errorCode, `${label} "${code}" was not found`);
    }

    return entity;
}

function requireParent(map, code, errorCode, label) {
    if (!map.has(code)) {
        throw AppError.notFound(
            errorCode,
            `Parent ${label} "${code}" was not found`
        );
    }
}

export function listDivisions({ includeDeprecated = false } = {}) {
    const snapshot = getSnapshot();
    return filterByDeprecated(snapshot.lists.divisions, includeDeprecated);
}

export function getDivision(code) {
    const snapshot = getSnapshot();
    return requireEntity(snapshot.maps.divisions, code, {
        code: "GEO_DIVISION_NOT_FOUND",
        label: "Division",
    });
}

export function listDistricts({
    divisionCode,
    includeDeprecated = false,
} = {}) {
    const snapshot = getSnapshot();

    if (divisionCode) {
        requireParent(
            snapshot.maps.divisions,
            divisionCode,
            "GEO_DIVISION_NOT_FOUND",
            "division"
        );

        return resolveCodes(
            snapshot.maps.districts,
            snapshot.children.districtsByDivision.get(divisionCode),
            includeDeprecated
        );
    }

    return filterByDeprecated(snapshot.lists.districts, includeDeprecated);
}

export function getDistrict(code) {
    const snapshot = getSnapshot();
    return requireEntity(snapshot.maps.districts, code, {
        code: "GEO_DISTRICT_NOT_FOUND",
        label: "District",
    });
}

export function listUpazilas({
    districtCode,
    includeDeprecated = false,
} = {}) {
    const snapshot = getSnapshot();

    if (districtCode) {
        requireParent(
            snapshot.maps.districts,
            districtCode,
            "GEO_DISTRICT_NOT_FOUND",
            "district"
        );

        return resolveCodes(
            snapshot.maps.upazilas,
            snapshot.children.upazilasByDistrict.get(districtCode),
            includeDeprecated
        );
    }

    return filterByDeprecated(snapshot.lists.upazilas, includeDeprecated);
}

export function getUpazila(code) {
    const snapshot = getSnapshot();
    return requireEntity(snapshot.maps.upazilas, code, {
        code: "GEO_UPAZILA_NOT_FOUND",
        label: "Upazila",
    });
}

export function listUnions({
    upazilaCode,
    districtCode,
    includeDeprecated = false,
} = {}) {
    const snapshot = getSnapshot();
    let unions = snapshot.lists.unions;

    if (upazilaCode) {
        requireParent(
            snapshot.maps.upazilas,
            upazilaCode,
            "GEO_UPAZILA_NOT_FOUND",
            "upazila"
        );

        unions = resolveCodes(
            snapshot.maps.unions,
            snapshot.children.unionsByUpazila.get(upazilaCode),
            includeDeprecated
        );
    } else if (districtCode) {
        requireParent(
            snapshot.maps.districts,
            districtCode,
            "GEO_DISTRICT_NOT_FOUND",
            "district"
        );

        unions = filterByDeprecated(
            snapshot.lists.unions.filter(
                (union) => union.districtCode === districtCode
            ),
            includeDeprecated
        );
    } else {
        unions = filterByDeprecated(unions, includeDeprecated);
    }

    return unions;
}

export function getUnion(code) {
    const snapshot = getSnapshot();
    return requireEntity(snapshot.maps.unions, code, {
        code: "GEO_UNION_NOT_FOUND",
        label: "Union",
    });
}

export function listPostOffices({
    districtCode,
    upazilaCode,
    includeDeprecated = false,
} = {}) {
    const snapshot = getSnapshot();

    if (upazilaCode) {
        requireParent(
            snapshot.maps.upazilas,
            upazilaCode,
            "GEO_UPAZILA_NOT_FOUND",
            "upazila"
        );

        return resolveCodes(
            snapshot.maps.postOffices,
            snapshot.children.postOfficesByUpazila.get(upazilaCode),
            includeDeprecated
        );
    }

    if (districtCode) {
        requireParent(
            snapshot.maps.districts,
            districtCode,
            "GEO_DISTRICT_NOT_FOUND",
            "district"
        );

        return resolveCodes(
            snapshot.maps.postOffices,
            snapshot.children.postOfficesByDistrict.get(districtCode),
            includeDeprecated
        );
    }

    return filterByDeprecated(snapshot.lists.postOffices, includeDeprecated);
}

export function getPostOffice(code) {
    const snapshot = getSnapshot();
    return requireEntity(snapshot.maps.postOffices, code, {
        code: "GEO_POST_OFFICE_NOT_FOUND",
        label: "Post office",
    });
}

export function getHierarchy({ depth = 4, includeDeprecated = false } = {}) {
    const snapshot = getSnapshot();

    const divisions = filterByDeprecated(
        snapshot.lists.divisions,
        includeDeprecated
    );

    if (depth < 2) {
        return { depth, divisions };
    }

    return {
        depth,
        divisions: divisions.map((division) => {
            const districts = resolveCodes(
                snapshot.maps.districts,
                snapshot.children.districtsByDivision.get(division.code),
                includeDeprecated
            );

            if (depth < 3) {
                return { ...division, districts };
            }

            return {
                ...division,
                districts: districts.map((district) => {
                    const upazilas = resolveCodes(
                        snapshot.maps.upazilas,
                        snapshot.children.upazilasByDistrict.get(district.code),
                        includeDeprecated
                    );

                    if (depth < 4) {
                        return { ...district, upazilas };
                    }

                    return {
                        ...district,
                        upazilas: upazilas.map((upazila) => ({
                            ...upazila,
                            unions: resolveCodes(
                                snapshot.maps.unions,
                                snapshot.children.unionsByUpazila.get(
                                    upazila.code
                                ),
                                includeDeprecated
                            ),
                        })),
                    };
                }),
            };
        }),
    };
}

export function searchLocations(options) {
    return searchSnapshot(options);
}

export function getDatasetMeta() {
    const snapshot = getSnapshot();

    return {
        datasetVersion: snapshot.meta.version,
        importedAt: snapshot.meta.importedAt,
        loadedAt: snapshot.loadedAt,
        note: snapshot.meta.note,
        counts: snapshot.meta.counts,
    };
}
