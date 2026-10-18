import fs from "node:fs/promises";
import path from "node:path";
import { importSchema } from "../modules/geography/geography.schemas.js";

const SOURCE_COMMIT = "5622f68bd07a98e076edcf8100bf0db6a75b9854";
const SOURCE_BASE = process.env.BD_GEO_SOURCE_BASE;
const SOURCE_DATE = "2023-03-17";
const TABLES = ["divisions", "districts", "upazilas", "unions"];

const DIVISION_ISO = new Map([
    ["Chattagram", "BD-10"],
    ["Rajshahi", "BD-54"],
    ["Khulna", "BD-27"],
    ["Barisal", "BD-61"],
    ["Sylhet", "BD-60"],
    ["Dhaka", "BD-13"],
    ["Rangpur", "BD-55"],
    ["Mymensingh", "BD-34"],
]);

const DIVISION_NAMES = new Map([
    ["Chattagram", "Chattogram"],
    ["Barisal", "Barishal"],
]);

const DISTRICT_NAMES = new Map([
    ["Comilla", "Cumilla"],
    ["Coxsbazar", "Cox's Bazar"],
    ["Jhalakathi", "Jhalokathi"],
]);

const DIVISION_ALIASES = new Map([
    ["Chattagram", ["Chattagram", "Chittagong"]],
    ["Barisal", ["Barisal"]],
    ["Dhaka", ["Dacca"]],
]);

const DISTRICT_ALIASES = new Map([
    ["Comilla", ["Comilla"]],
    ["Coxsbazar", ["Coxsbazar", "Coxs Bazar"]],
    ["Jhalakathi", ["Jhalakathi"]],
    ["Netrokona", ["Netrakona"]],
]);

const sourceDir = process.env.BD_GEO_SOURCE_DIR;
const outputFile = process.argv[2]
    ? path.resolve(process.argv[2])
    : new URL("../modules/geography/data/bd-geo.json", import.meta.url);

async function loadTable(name) {
    let payload;

    if (sourceDir) {
        const file = path.join(sourceDir, `${name}.json`);
        payload = JSON.parse(await fs.readFile(file, "utf8"));
    } else {
        if (!SOURCE_BASE) {
            throw new Error(
                "Set BD_GEO_SOURCE_DIR or BD_GEO_SOURCE_BASE to rebuild the dataset"
            );
        }

        const url = `${SOURCE_BASE}/${name}/${name}.json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
        }

        payload = await response.json();
    }

    const table = payload.find(
        (entry) => entry.type === "table" && entry.name === name
    );

    if (!table?.data) {
        throw new Error(`No "${name}" table found in the source payload`);
    }

    return table.data;
}

function padded(id, width) {
    return String(id).padStart(width, "0");
}

function requireValue(row, field, table) {
    const value = row[field];

    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(
            `Missing ${field} for row ${row.id ?? "(unknown)"} in ${table}`
        );
    }

    return value.trim();
}

function buildDataset(tables) {
    const divisions = tables.divisions.map((row) => {
        const code = DIVISION_ISO.get(row.name);

        if (!code) {
            throw new Error(`No ISO code mapping for division "${row.name}"`);
        }

        return {
            code,
            name:
                DIVISION_NAMES.get(row.name) ??
                requireValue(row, "name", "divisions"),
            bn_name: requireValue(row, "bn_name", "divisions"),
            iso_code: code,
            aliases: DIVISION_ALIASES.get(row.name) ?? [],
        };
    });

    const divisionCodeById = new Map(
        tables.divisions.map((row, index) => [String(row.id), divisions[index].code])
    );

    const districts = tables.districts.map((row) => {
        const divisionCode = divisionCodeById.get(String(row.division_id));

        if (!divisionCode) {
            throw new Error(
                `Unknown division ${row.division_id} for district ${row.id}`
            );
        }

        return {
            code: `D-${padded(row.id, 2)}`,
            name:
                DISTRICT_NAMES.get(row.name) ??
                requireValue(row, "name", "districts"),
            bn_name: requireValue(row, "bn_name", "districts"),
            divisionCode,
            aliases: DISTRICT_ALIASES.get(row.name) ?? [],
        };
    });

    const districtCodes = new Set(districts.map((district) => district.code));

    const upazilas = tables.upazilas.map((row) => {
        const districtCode = `D-${padded(row.district_id, 2)}`;

        if (!districtCodes.has(districtCode)) {
            throw new Error(
                `Unknown district ${row.district_id} for upazila ${row.id}`
            );
        }

        return {
            code: `U-${padded(row.id, 4)}`,
            name: requireValue(row, "name", "upazilas"),
            bn_name: requireValue(row, "bn_name", "upazilas"),
            districtCode,
            aliases: [],
        };
    });

    const upazilaCodes = new Set(upazilas.map((upazila) => upazila.code));

    const unions = tables.unions.map((row) => {
        const upazilaCode = `U-${padded(row.upazilla_id, 4)}`;

        if (!upazilaCodes.has(upazilaCode)) {
            throw new Error(
                `Unknown upazila ${row.upazilla_id} for union ${row.id}`
            );
        }

        return {
            code: `UN-${padded(row.id, 4)}`,
            name: requireValue(row, "name", "unions"),
            bn_name: requireValue(row, "bn_name", "unions"),
            upazilaCode,
            aliases: [],
        };
    });

    return {
        datasetVersion: `${SOURCE_DATE}-${SOURCE_COMMIT.slice(0, 7)}`,
        note: "Community dataset derived from public sources. Postal codes are not included. Verify against an authoritative BBS/a2i release before production use.",
        divisions,
        districts,
        upazilas,
        unions,
        postOffices: [],
    };
}

async function main() {
    const tables = {};

    for (const name of TABLES) {
        tables[name] = await loadTable(name);
    }

    const dataset = buildDataset(tables);
    const payload = importSchema.parse(dataset);

    await fs.writeFile(
        outputFile,
        `${JSON.stringify(payload, null, 2)}\n`,
        "utf8"
    );

    console.log(
        JSON.stringify(
            {
                output: outputFile instanceof URL ? outputFile.pathname : outputFile,
                datasetVersion: payload.datasetVersion,
                counts: {
                    divisions: payload.divisions.length,
                    districts: payload.districts.length,
                    upazilas: payload.upazilas.length,
                    unions: payload.unions.length,
                    postOffices: payload.postOffices.length,
                },
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(`Dataset build failed: ${error.message}`);
    process.exit(1);
});
