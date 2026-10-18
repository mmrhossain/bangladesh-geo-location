import { z } from "zod";

const CODE_PATTERN = /^[A-Za-z0-9-]+$/;

export const codeSchema = z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(CODE_PATTERN, "Code may only contain letters, numbers and hyphens")
    .transform((value) => value.toUpperCase());

const nameSchema = z.string().trim().min(1).max(160);
const aliasesSchema = z
    .array(z.string().trim().min(1).max(160))
    .max(20)
    .default([]);

const baseEntityShape = {
    code: codeSchema,
    name: nameSchema,
    bn_name: nameSchema,
    aliases: aliasesSchema,
};

export const divisionInputSchema = z
    .object({
        ...baseEntityShape,
        iso_code: z.string().trim().min(1).max(16).optional(),
    })
    .strict();

export const districtInputSchema = z
    .object({
        ...baseEntityShape,
        divisionCode: codeSchema,
    })
    .strict();

export const upazilaInputSchema = z
    .object({
        ...baseEntityShape,
        districtCode: codeSchema,
    })
    .strict();

export const unionInputSchema = z
    .object({
        ...baseEntityShape,
        upazilaCode: codeSchema,
    })
    .strict();

export const postOfficeInputSchema = z
    .object({
        ...baseEntityShape,
        districtCode: codeSchema,
        upazilaCode: codeSchema.optional(),
    })
    .strict();

function duplicateCodes(items) {
    const seen = new Set();
    const duplicates = new Set();

    for (const item of items) {
        if (seen.has(item.code)) {
            duplicates.add(item.code);
        }
        seen.add(item.code);
    }

    return [...duplicates];
}

function duplicateScopedNames(items, parentKey) {
    const seen = new Set();
    const duplicates = new Set();

    for (const item of items) {
        const key = `${item[parentKey] ?? ""}::${item.name.toLowerCase()}`;
        if (seen.has(key)) {
            duplicates.add(`${item[parentKey] ?? ""}:${item.name}`);
        }
        seen.add(key);
    }

    return [...duplicates];
}

export const importSchema = z
    .object({
        datasetVersion: z.string().trim().min(1).max(64).optional(),
        note: z.string().trim().max(500).optional(),
        divisions: z.array(divisionInputSchema).max(100).default([]),
        districts: z.array(districtInputSchema).max(200).default([]),
        upazilas: z.array(upazilaInputSchema).max(2_000).default([]),
        unions: z.array(unionInputSchema).max(20_000).default([]),
        postOffices: z.array(postOfficeInputSchema).max(5_000).default([]),
    })
    .strict()
    .superRefine((value, ctx) => {
        const collections = [
            ["divisions", value.divisions, null],
            ["districts", value.districts, "divisionCode"],
            ["upazilas", value.upazilas, "districtCode"],
            ["unions", value.unions, "upazilaCode"],
            ["postOffices", value.postOffices, "districtCode"],
        ];

        let total = 0;

        for (const [name, items, parentKey] of collections) {
            total += items.length;

            const duplicateCodeList = duplicateCodes(items);
            if (duplicateCodeList.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [name],
                    message: `Duplicate codes in payload: ${duplicateCodeList.join(", ")}`,
                });
            }

            if (!parentKey) {
                const duplicateNameList = duplicateScopedNames(items, "divisionCode");
                if (duplicateNameList.length > 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: [name],
                        message: `Duplicate names: ${duplicateNameList.join(", ")}`,
                    });
                }
            }
        }

        if (total === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [],
                message: "At least one entity is required",
            });
        }
    });

export const codeParamSchema = z.object({
    code: codeSchema,
});

export const RESOURCES = [
    "divisions",
    "districts",
    "upazilas",
    "unions",
    "post-offices",
];

const includeDeprecatedSchema = z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true");

export const listQuerySchema = z.object({
    divisionCode: codeSchema.optional(),
    districtCode: codeSchema.optional(),
    upazilaCode: codeSchema.optional(),
    includeDeprecated: includeDeprecatedSchema,
    limit: z.coerce.number().int().min(1).max(200).optional(),
    cursor: z.string().trim().min(1).max(512).optional(),
});

export const searchQuerySchema = z.object({
    q: z.string().trim().min(1).max(160),
    type: z
        .enum(["division", "district", "upazila", "union", "post-office"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    includeDeprecated: includeDeprecatedSchema,
});

export const hierarchyQuerySchema = z.object({
    depth: z.coerce.number().int().min(1).max(4).default(4),
    includeDeprecated: includeDeprecatedSchema,
});
