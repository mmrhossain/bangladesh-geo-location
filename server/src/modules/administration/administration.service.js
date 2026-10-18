import env from "../../shared/config/env.js";
import {
    findByCode,
    getSnapshot,
    invalidateSnapshot,
    listCodeIdMap,
    models,
    saveMeta,
    setDeprecatedByCode,
    updateByCode,
    upsertManyByCode,
} from "../geography/index.js";
import { AppError } from "../../shared/errors/AppError.js";
import { publishCacheInvalidation } from "../../shared/persistence/cacheEvents.js";
import {
    datasetImportDuration,
    datasetImportsTotal,
} from "../../shared/observability/metrics.js";
import { buildSearchText, slugify } from "../../shared/utils/text.js";

const RESOURCE_CONFIG = {
    divisions: {
        model: models.divisions,
        label: "Division",
        cacheKey: "divisions",
        supportsIsoCode: true,
    },
    districts: {
        model: models.districts,
        label: "District",
        cacheKey: "districts",
    },
    upazilas: {
        model: models.upazilas,
        label: "Upazila",
        cacheKey: "upazilas",
    },
    unions: {
        model: models.unions,
        label: "Union",
        cacheKey: "unions",
    },
    "post-offices": {
        model: models["post-offices"],
        label: "Post office",
        cacheKey: "postOffices",
    },
};

function getResourceConfig(resource) {
    const config = RESOURCE_CONFIG[resource];

    if (!config) {
        throw AppError.notFound(
            "GEO_RESOURCE_NOT_FOUND",
            `Unknown resource "${resource}"`
        );
    }

    return config;
}

function entityFields(item, version) {
    return {
        name: item.name,
        bn_name: item.bn_name,
        slug: slugify(item.name, item.code),
        aliases: item.aliases,
        search_text: buildSearchText([
            item.code,
            item.name,
            item.bn_name,
            ...item.aliases,
        ]),
        dataset_version: version,
    };
}

async function buildParentLookups() {
    const [divisions, districts, upazilas] = await Promise.all([
        models.divisions.find({}, { _id: 1, code: 1 }).lean(),
        models.districts.find({}, { _id: 1, code: 1, division: 1 }).lean(),
        models.upazilas.find({}, { _id: 1, code: 1, district: 1 }).lean(),
    ]);

    const divisionCodeById = new Map(
        divisions.map((division) => [String(division._id), division.code])
    );
    const districtCodeById = new Map(
        districts.map((district) => [String(district._id), district.code])
    );

    return {
        divisionCodes: new Set(divisions.map((division) => division.code)),
        districtParents: new Map(
            districts.map((district) => [
                district.code,
                divisionCodeById.get(String(district.division)) ?? null,
            ])
        ),
        upazilaParents: new Map(
            upazilas.map((upazila) => [
                upazila.code,
                districtCodeById.get(String(upazila.district)) ?? null,
            ])
        ),
    };
}

function preflight(payload, existing) {
    const divisionCodes = new Set(existing.divisionCodes);
    const districtParents = new Map(existing.districtParents);
    const upazilaParents = new Map(existing.upazilaParents);

    for (const division of payload.divisions) {
        divisionCodes.add(division.code);
    }

    for (const district of payload.districts) {
        districtParents.set(district.code, district.divisionCode);
    }

    for (const upazila of payload.upazilas) {
        upazilaParents.set(upazila.code, upazila.districtCode);
    }

    for (const district of payload.districts) {
        if (!divisionCodes.has(district.divisionCode)) {
            throw AppError.badRequest(
                "UNKNOWN_PARENT",
                `District "${district.code}" references unknown division "${district.divisionCode}"`
            );
        }
    }

    for (const upazila of payload.upazilas) {
        if (!districtParents.has(upazila.districtCode)) {
            throw AppError.badRequest(
                "UNKNOWN_PARENT",
                `Upazila "${upazila.code}" references unknown district "${upazila.districtCode}"`
            );
        }
    }

    for (const union of payload.unions) {
        if (!upazilaParents.has(union.upazilaCode)) {
            throw AppError.badRequest(
                "UNKNOWN_PARENT",
                `Union "${union.code}" references unknown upazila "${union.upazilaCode}"`
            );
        }
    }

    for (const postOffice of payload.postOffices) {
        if (!districtParents.has(postOffice.districtCode)) {
            throw AppError.badRequest(
                "UNKNOWN_PARENT",
                `Post office "${postOffice.code}" references unknown district "${postOffice.districtCode}"`
            );
        }

        if (
            postOffice.upazilaCode &&
            upazilaParents.get(postOffice.upazilaCode) !==
                postOffice.districtCode
        ) {
            throw AppError.badRequest(
                "PARENT_MISMATCH",
                `Post office "${postOffice.code}" references upazila "${postOffice.upazilaCode}" which does not belong to district "${postOffice.districtCode}"`
            );
        }
    }
}

async function countAll() {
    const [divisions, districts, upazilas, unions, postOffices] =
        await Promise.all([
            models.divisions.countDocuments(),
            models.districts.countDocuments(),
            models.upazilas.countDocuments(),
            models.unions.countDocuments(),
            models["post-offices"].countDocuments(),
        ]);

    return { divisions, districts, upazilas, unions, postOffices };
}

async function importDatasetCore(payload) {
    const version = payload.datasetVersion || env.DATASET_VERSION;
    const existing = await buildParentLookups();

    preflight(payload, existing);

    const importedAt = new Date();

    await upsertManyByCode(models.divisions, payload.divisions, (item) => ({
        ...entityFields(item, version),
        iso_code: item.iso_code ?? null,
    }));

    const divisionIds = await listCodeIdMap(models.divisions);

    await upsertManyByCode(models.districts, payload.districts, (item) => ({
        ...entityFields(item, version),
        division: divisionIds.get(item.divisionCode),
    }));

    const districtIds = await listCodeIdMap(models.districts);

    await upsertManyByCode(models.upazilas, payload.upazilas, (item) => ({
        ...entityFields(item, version),
        district: districtIds.get(item.districtCode),
    }));

    const upazilaIds = await listCodeIdMap(models.upazilas);

    await upsertManyByCode(models.unions, payload.unions, (item) => ({
        ...entityFields(item, version),
        upazila: upazilaIds.get(item.upazilaCode),
    }));

    await upsertManyByCode(
        models["post-offices"],
        payload.postOffices,
        (item) => ({
            ...entityFields(item, version),
            district: districtIds.get(item.districtCode),
            upazila: item.upazilaCode
                ? upazilaIds.get(item.upazilaCode)
                : null,
        })
    );

    const counts = await countAll();
    await saveMeta({
        version,
        importedAt,
        counts,
        note: payload.note ?? null,
    });
    await invalidateSnapshot();
    await publishCacheInvalidation("dataset.import");

    return {
        datasetVersion: version,
        importedAt: importedAt.toISOString(),
        note: payload.note ?? null,
        counts,
    };
}

export async function importDataset(payload) {
    const end = datasetImportDuration.startTimer();

    try {
        const summary = await importDatasetCore(payload);
        datasetImportsTotal.inc({ status: "success" });
        return summary;
    } catch (error) {
        datasetImportsTotal.inc({ status: "failure" });
        throw error;
    } finally {
        end();
    }
}

function cacheEntity(resource, code) {
    const config = getResourceConfig(resource);
    return getSnapshot().maps[config.cacheKey].get(code) ?? null;
}

export async function updateEntity(resource, code, data) {
    const config = getResourceConfig(resource);
    const existing = await findByCode(config.model, code);

    if (!existing) {
        throw AppError.notFound(
            "GEO_RESOURCE_NOT_FOUND",
            `${config.label} "${code}" was not found`
        );
    }

    const fields = {};

    if (data.name !== undefined) {
        fields.name = data.name;
        fields.slug = slugify(data.name, code);
    }
    if (data.bn_name !== undefined) {
        fields.bn_name = data.bn_name;
    }
    if (data.aliases !== undefined) {
        fields.aliases = data.aliases;
    }
    if (data.iso_code !== undefined && config.supportsIsoCode) {
        fields.iso_code = data.iso_code;
    }

    const name = fields.name ?? existing.name;
    const bnName = fields.bn_name ?? existing.bn_name;
    const aliases = fields.aliases ?? existing.aliases ?? [];

    fields.search_text = buildSearchText([code, name, bnName, ...aliases]);

    const updated = await updateByCode(config.model, code, fields);

    if (!updated) {
        throw AppError.notFound(
            "GEO_RESOURCE_NOT_FOUND",
            `${config.label} "${code}" was not found`
        );
    }

    await invalidateSnapshot();
    await publishCacheInvalidation("entity.update");
    return cacheEntity(resource, code);
}

export async function deprecateEntity(resource, code, deprecated) {
    const config = getResourceConfig(resource);
    const updated = await setDeprecatedByCode(config.model, code, deprecated);

    if (!updated) {
        throw AppError.notFound(
            "GEO_RESOURCE_NOT_FOUND",
            `${config.label} "${code}" was not found`
        );
    }

    await invalidateSnapshot();
    await publishCacheInvalidation("entity.deprecate");
    return cacheEntity(resource, code);
}
