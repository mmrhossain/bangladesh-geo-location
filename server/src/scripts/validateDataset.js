import fs from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { importSchema } from "../modules/geography/geography.schemas.js";

const file = process.argv[2];

if (!file) {
    console.error(
        "Usage: npm run dataset:validate -- ./path/to/dataset.json"
    );
    process.exit(1);
}

try {
    const raw = JSON.parse(
        await fs.readFile(path.resolve(file), "utf8")
    );
    const payload = importSchema.parse(raw);

    console.log(
        JSON.stringify(
            {
                valid: true,
                datasetVersion: payload.datasetVersion ?? null,
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
} catch (error) {
    if (error instanceof ZodError) {
        console.error(
            JSON.stringify(
                { valid: false, errors: error.flatten() },
                null,
                2
            )
        );
    } else {
        console.error(`Invalid dataset: ${error.message}`);
    }

    process.exit(1);
}
