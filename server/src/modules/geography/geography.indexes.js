import DatasetMeta from "./models/datasetMeta.model.js";
import { models } from "./geography.repository.js";

export async function ensureIndexes(logger) {
    const targets = [
        ...Object.entries(models),
        ["datasetMeta", DatasetMeta],
    ];

    for (const [name, model] of targets) {
        await model.syncIndexes();
        logger?.info({ model: name }, "Indexes synchronized");
    }
}

export default ensureIndexes;
