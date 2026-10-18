import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
    importSchema,
    hierarchyQuerySchema,
} from "../src/modules/geography/geography.schemas.js";
import { updateEntitySchema } from "../src/modules/administration/administration.schemas.js";
import { buildSearchText, normalizeText, slugify } from "../src/shared/utils/text.js";

test("sample dataset validates against the import schema", async () => {
    const raw = await fs.readFile(
        new URL("../src/modules/geography/data/bd-geo.sample.json", import.meta.url),
        "utf8"
    );
    const payload = importSchema.parse(JSON.parse(raw));

    assert.equal(payload.divisions.length, 8);
    assert.equal(payload.datasetVersion, "1.0.0-sample");
});

test("full dataset validates and preserves real-world duplicates", async () => {
    const raw = await fs.readFile(
        new URL("../src/modules/geography/data/bd-geo.json", import.meta.url),
        "utf8"
    );
    const payload = importSchema.parse(JSON.parse(raw));

    assert.equal(payload.divisions.length, 8);
    assert.equal(payload.districts.length, 64);
    assert.equal(payload.upazilas.length, 494);
    assert.equal(payload.unions.length, 4_540);
});

test("dataset source metadata is rejected", () => {
    assert.throws(() =>
        importSchema.parse({
            source: {
                name: "Example",
                url: "https://example.gov.bd/dataset",
            },
        })
    );
});

test("codes are trimmed and uppercased", () => {
    const payload = importSchema.parse({
        divisions: [
            {
                code: " bd-13 ",
                name: "Dhaka",
                bn_name: "ঢাকা",
                iso_code: "BD-13",
            },
        ],
    });

    assert.equal(payload.divisions[0].code, "BD-13");
});

test("duplicate codes are rejected", () => {
    assert.throws(() =>
        importSchema.parse({
            divisions: [
                { code: "BD-13", name: "Dhaka", bn_name: "ঢাকা" },
                { code: "bd-13", name: "Dhaka 2", bn_name: "ঢাকা ২" },
            ],
        })
    );
});

test("duplicate names under the same parent are allowed", () => {
    const payload = importSchema.parse({
        unions: [
            {
                code: "UN-1",
                name: "Natai",
                bn_name: "নাটাই",
                upazilaCode: "U-1",
            },
            {
                code: "UN-2",
                name: "Natai",
                bn_name: "নাটাই",
                upazilaCode: "U-1",
            },
        ],
    });

    assert.equal(payload.unions.length, 2);
});

test("unknown fields are rejected", () => {
    assert.throws(() =>
        importSchema.parse({
            divisions: [
                {
                    code: "BD-13",
                    name: "Dhaka",
                    bn_name: "ঢাকা",
                    isAdmin: true,
                },
            ],
        })
    );
});

test("update schema requires at least one field", () => {
    assert.throws(() => updateEntitySchema.parse({}));
    assert.deepEqual(updateEntitySchema.parse({ name: "New name" }), {
        name: "New name",
    });
});

test("hierarchy query applies safe defaults and bounds", () => {
    assert.deepEqual(hierarchyQuerySchema.parse({}), {
        depth: 4,
        includeDeprecated: false,
    });
    assert.throws(() => hierarchyQuerySchema.parse({ depth: "9" }));
});

test("text helpers normalize and slugify", () => {
    assert.equal(normalizeText("  Cox's   Bazar "), "cox s bazar");
    assert.equal(slugify("Cox's Bazar"), "cox-s-bazar");
    assert.equal(slugify("কক্সবাজার", "COX"), "cox");
    assert.equal(buildSearchText(["DHK", "Dhaka", "ঢাকা"]), "dhk dhaka ঢাকা");
});
