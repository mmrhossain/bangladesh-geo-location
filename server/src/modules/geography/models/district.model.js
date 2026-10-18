import mongoose from "mongoose";

const districtSchema = new mongoose.Schema(
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
            lowercase: true,
            trim: true,
        },
        division: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Division",
            required: true,
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

districtSchema.index({ division: 1 });
districtSchema.index({ slug: 1 });
districtSchema.index({ deprecated_at: 1 });

const District =
    mongoose.models.District || mongoose.model("District", districtSchema);

export default District;
