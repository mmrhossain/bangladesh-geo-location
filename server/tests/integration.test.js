import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test, { after, before } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let server;
let baseUrl;
let mongoose;
let app;
let sampleBody;

const ADMIN_KEY = "integration-test-admin-key-123456";

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const body = await response.json();
    return { response, body };
}

before(async () => {
    mongo = await MongoMemoryServer.create();

    process.env.NODE_ENV = "test";
    process.env.MONGODB_URL = mongo.getUri();
    process.env.ADMIN_API_KEY = ADMIN_KEY;
    process.env.LOG_LEVEL = "silent";
    process.env.RATE_LIMIT_MAX = "10000";
    process.env.CORS_ORIGINS = "*";

    const [{ default: connectDB }, { importSchema }] = await Promise.all([
        import("../src/shared/config/connectDB.js"),
        import("../src/modules/geography/index.js"),
    ]);

    const raw = await fs.readFile(
        new URL("../src/modules/geography/data/bd-geo.sample.json", import.meta.url),
        "utf8"
    );
    const payload = importSchema.parse(JSON.parse(raw));
    sampleBody = JSON.stringify(payload);

    const { importDataset } = await import("../src/modules/administration/index.js");
    const { ensureIndexes } = await import("../src/modules/geography/index.js");
    const { default: mongooseModule } = await import("mongoose");

    mongoose = mongooseModule;
    await connectDB();
    await ensureIndexes();
    await importDataset(payload);

    app = (await import("../app.js")).default;
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose) {
        await mongoose.connection.close();
    }
    if (mongo) {
        await mongo.stop();
    }
});

test("health endpoint responds", async () => {
    const { response, body } = await request("/health");
    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
});

test("ready endpoint reports the loaded snapshot", async () => {
    const { response, body } = await request("/ready");
    assert.equal(response.status, 200);
    assert.equal(body.snapshot.ready, true);
    assert.equal(body.snapshot.counts.divisions, 8);
});

test("Redis integration falls back safely when not configured", async () => {
    const { getRedisClient, isRedisEnabled } = await import(
        "../src/shared/persistence/redis.js"
    );

    assert.equal(isRedisEnabled(), false);
    assert.equal(getRedisClient(), null);
});

test("tracing is disabled by default", async () => {
    const { isTracingActive, startTracing } = await import(
        "../src/shared/observability/tracing.js"
    );

    assert.equal(await startTracing(), false);
    assert.equal(isTracingActive(), false);
});

test("dataset metadata includes version and counts", async () => {
    const { response, body } = await request("/api/v1/meta/dataset");

    assert.equal(response.status, 200);
    assert.equal(body.data.datasetVersion, "1.0.0-sample");
    assert.equal(body.data.source, undefined);
    assert.ok(body.data.note);
});

test("lists all divisions", async () => {
    const { response, body } = await request("/api/v1/divisions");
    assert.equal(response.status, 200);
    assert.equal(body.data.length, 8);
});

test("returns districts for a division", async () => {
    const { body } = await request("/api/v1/divisions/BD-13/districts");
    assert.equal(body.data.length, 3);
    assert.ok(body.data.every((item) => item.divisionCode === "BD-13"));
});

test("returns unions for an upazila", async () => {
    const { body } = await request("/api/v1/upazilas/DHK-SAV/unions");
    assert.equal(body.data.length, 2);
});

test("searches in Bangla without breaking conjuncts", async () => {
    const { body } = await request(
        `/api/v1/search?q=${encodeURIComponent("সাভার")}`
    );
    assert.ok(body.data.total > 0);
    assert.ok(body.data.items.some((item) => item.code === "DHK-SAV"));
});

test("builds a nested hierarchy", async () => {
    const { body } = await request("/api/v1/hierarchy?depth=2");
    assert.equal(body.data.depth, 2);
    assert.ok(Array.isArray(body.data.divisions[0].districts));
});

test("rejects malformed codes with 400", async () => {
    const { response, body } = await request("/api/v1/divisions/INVALID!!");
    assert.equal(response.status, 400);
    assert.equal(body.code, "VALIDATION_ERROR");
});

test("returns 404 for unknown entities", async () => {
    const { response, body } = await request("/api/v1/divisions/ZZZ");
    assert.equal(response.status, 404);
    assert.equal(body.code, "GEO_DIVISION_NOT_FOUND");
});

test("protects admin routes", async () => {
    const { response } = await request("/api/v1/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: sampleBody,
    });
    assert.equal(response.status, 401);
});

test("re-importing the same dataset is idempotent", async () => {
    const { response, body } = await request("/api/v1/admin/import", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": ADMIN_KEY,
        },
        body: sampleBody,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.counts, {
        divisions: 8,
        districts: 11,
        upazilas: 14,
        unions: 10,
        postOffices: 8,
    });
});

test("admin import accepts bodies above the normal JSON limit", async () => {
    const { response, body } = await request("/api/v1/admin/import", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": ADMIN_KEY,
        },
        body: JSON.stringify({ note: "x".repeat(120_000) }),
    });

    assert.equal(response.status, 400);
    assert.equal(body.code, "VALIDATION_ERROR");
});

test("admin updates invalidate the read cache", async () => {
    const { response, body } = await request(
        "/api/v1/admin/divisions/BD-13",
        {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                "x-api-key": ADMIN_KEY,
            },
            body: JSON.stringify({ aliases: ["Dacca", "Test Alias"] }),
        }
    );

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.aliases, ["Dacca", "Test Alias"]);

    const list = await request("/api/v1/divisions/BD-13");
    assert.deepEqual(list.body.data.aliases, ["Dacca", "Test Alias"]);

    await request("/api/v1/admin/divisions/BD-13", {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            "x-api-key": ADMIN_KEY,
        },
        body: JSON.stringify({ aliases: ["Dacca"] }),
    });
});

test("deprecated entities are hidden by default and can be restored", async () => {
    const deprecate = await request(
        "/api/v1/admin/unions/DHK-SAV-02/deprecate",
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": ADMIN_KEY,
            },
            body: JSON.stringify({ deprecated: true }),
        }
    );
    assert.equal(deprecate.response.status, 200);

    const hidden = await request("/api/v1/upazilas/DHK-SAV/unions");
    assert.equal(hidden.body.data.length, 1);

    const included = await request(
        "/api/v1/upazilas/DHK-SAV/unions?includeDeprecated=true"
    );
    assert.equal(included.body.data.length, 2);

    const restore = await request(
        "/api/v1/admin/unions/DHK-SAV-02/deprecate",
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": ADMIN_KEY,
            },
            body: JSON.stringify({ deprecated: false }),
        }
    );
    assert.equal(restore.response.status, 200);

    const restored = await request("/api/v1/upazilas/DHK-SAV/unions");
    assert.equal(restored.body.data.length, 2);
});

test("cursor pagination returns disjoint pages", async () => {
    const first = await request("/api/v1/unions?limit=3");
    assert.equal(first.response.status, 200);
    assert.equal(first.body.data.length, 3);
    assert.equal(first.body.meta.limit, 3);
    assert.equal(first.body.meta.hasMore, true);
    assert.ok(first.body.meta.nextCursor);

    const second = await request(
        `/api/v1/unions?limit=3&cursor=${encodeURIComponent(
            first.body.meta.nextCursor
        )}`
    );
    assert.equal(second.response.status, 200);
    assert.equal(second.body.data.length, 3);

    const firstCodes = new Set(first.body.data.map((item) => item.code));
    assert.ok(second.body.data.every((item) => !firstCodes.has(item.code)));
});

test("invalid pagination cursor is rejected with 400", async () => {
    const { response, body } = await request(
        "/api/v1/unions?limit=3&cursor=not-a-cursor"
    );

    assert.equal(response.status, 400);
    assert.equal(body.code, "INVALID_CURSOR");
});

test("serves the OpenAPI document", async () => {
    const { response, body } = await request("/api/v1/openapi.json");

    assert.equal(response.status, 200);
    assert.equal(body.openapi, "3.0.3");
    assert.ok(body.paths["/divisions"]);
    assert.ok(body.paths["/admin/import"]);
});

test("exposes Prometheus metrics", async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.match(text, /bd_geo_/);
    assert.match(text, /bd_geo_cache_entities/);
    assert.match(text, /bd_geo_dataset_imports_total/);
    assert.match(text, /bd_geo_admin_writes_total/);
});
