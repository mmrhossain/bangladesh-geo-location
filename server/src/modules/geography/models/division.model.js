import mongoose from "mongoose";

const divisionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        bn_name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        iso_code: {
            type: String,
            uppercase: true,
            trim: true,
            default: null,
        },
        aliases: {
            type: [String],
            default: [],
        },
        search_text: {
            type: String,
            required: true,
            trim: true,
        },
        dataset_version: {
            type: String,
            required: true,
            trim: true,
        },
        deprecated_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

divisionSchema.index({ name: 1 });
divisionSchema.index({ deprecated_at: 1 });

const Division =
    mongoose.models.Division || mongoose.model("Division", divisionSchema);

export default Division;
