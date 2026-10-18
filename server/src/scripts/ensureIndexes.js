import mongoose from "mongoose";
import connectDB from "../shared/config/connectDB.js";
import logger from "../shared/logging/logger.js";
import { ensureIndexes } from "../modules/geography/geography.indexes.js";

async function main() {
    await connectDB();
    await ensureIndexes(logger);
    logger.info("All indexes synchronized");
    await mongoose.connection.close();
}

main().catch(async (error) => {
    logger.error({ err: error }, "Index synchronization failed");

    try {
        await mongoose.connection.close();
    } catch {
        // Ignore close errors.
    }

    process.exit(1);
});
