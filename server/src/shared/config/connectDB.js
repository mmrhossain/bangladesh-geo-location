import mongoose from "mongoose";
import env from "./env.js";
import logger from "../logging/logger.js";

mongoose.set("strictQuery", true);

export default async function connectDB() {
    try {
        await mongoose.connect(env.MONGODB_URL, {
            autoIndex: !env.isProduction,
            serverSelectionTimeoutMS: 10_000,
            maxPoolSize: 10,
        });

        logger.info("Connected to MongoDB");
        return mongoose.connection;
    } catch (error) {
        logger.error({ err: error }, "Failed to connect to MongoDB");
        throw error;
    }
}
