import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test, { after, before } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let mongoose;

before(async () => {
    mongo = await MongoMemoryServer.create();

    process.env.NODE_ENV = "test";
    process.env.MONGODB_URL = mongo.getUri();
    process.env.ADMIN_API_KEY = "full-dataset-admin-key-123456";
    process.env.LOG_LEVEL = "silent";

    const [{ default: connectDB }, { importSchema }] = await Promise.all([
        import("../src/shared/config/connectDB.js"),
        import("../src/modules/geography/index.js"),
    ]);

    const raw = await fs.readFile(
        new URL("../src/modules/geography/data/bd-geo.json", import.meta.url),
        "utf8"
    );
    const payload = importSchema.parse(JSON.parse(raw));

    mongoose = (await import("mongoose")).default;
    await connectDB();

    const { ensureIndexes } = await import("../src/modules/geography/index.js");
    const { importDataset } = await import("../src/modules/administration/index.js");

    await ensureIndexes();
    await importDataset(payload);
});

after(async () => {
    if (mongoose) {
        await mongoose.connection.close();
    }
    if (mongo) {
        await mongo.stop();
    }
});

test("imports the full real-world dataset", async () => {
    const { models } = await import("../src/modules/geography/index.js");

    assert.equal(await models.divisions.countDocuments(), 8);
    assert.equal(await models.districts.countDocuments(), 64);
    assert.equal(await models.upazilas.countDocuments(), 494);
    assert.equal(await models.unions.countDocuments(), 4_540);
});

test("stores duplicate union names with distinct codes", async () => {
    const { models } = await import("../src/modules/geography/index.js");
    const unions = await models.unions
        .find({ name: "Natai" }, { code: 1, name: 1 })
        .lean();

    assert.equal(unions.length, 2);
    assert.notEqual(unions[0].code, unions[1].code);
});

test("loads the full dataset into the snapshot", async () => {
    const { getSnapshotHealth, loadSnapshot, searchSnapshot } = await import(
        "../src/modules/geography/index.js"
    );

    await loadSnapshot();

    const health = getSnapshotHealth();
    assert.equal(health.ready, true);
    assert.equal(health.counts.districts, 64);
    assert.equal(health.counts.unions, 4_540);

    const results = searchSnapshot({
        q: "Natai",
        type: null,
        page: 1,
        limit: 10,
        includeDeprecated: false,
    });

    assert.ok(results.total >= 2);
});
