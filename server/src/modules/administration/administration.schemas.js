import { z } from "zod";
import { RESOURCES, codeSchema } from "../geography/geography.schemas.js";

const nameSchema = z.string().trim().min(1).max(160);

const updateShape = {
    name: nameSchema.optional(),
    bn_name: nameSchema.optional(),
    aliases: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
    iso_code: z.string().trim().min(1).max(16).nullable().optional(),
};

export const updateEntitySchema = z
    .object(updateShape)
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field must be provided",
    });

export const deprecateEntitySchema = z
    .object({
        deprecated: z.boolean().default(true),
    })
    .strict();

export const resourceParamSchema = z.object({
    resource: z.enum(RESOURCES),
    code: codeSchema,
});
