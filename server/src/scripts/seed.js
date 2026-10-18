import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { ensureIndexes, importSchema } from "../modules/geography/index.js";
import { importDataset } from "../modules/administration/index.js";
import connectDB from "../shared/config/connectDB.js";
import logger from "../shared/logging/logger.js";
import { closeRedis, connectRedis } from "../shared/persistence/redis.js";

const defaultFile = new URL("../modules/geography/data/bd-geo.json", import.meta.url);
const file = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;

async function main() {
    const raw = JSON.parse(await fs.readFile(file, "utf8"));
    const payload = importSchema.parse(raw);

    await connectDB();
    await connectRedis();
    await ensureIndexes(logger);
    const summary = await importDataset(payload);

    logger.info(
        {
            datasetVersion: summary.datasetVersion,
            counts: summary.counts,
        },
        "Dataset imported successfully"
    );

    await closeRedis();
    await mongoose.connection.close();
}

main().catch(async (error) => {
    logger.error({ err: error }, "Dataset import failed");

    try {
        await closeRedis();
        await mongoose.connection.close();
    } catch {
        // Ignore close errors.
    }

    process.exit(1);
});
