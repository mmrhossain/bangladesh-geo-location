import mongoose from "mongoose";

const unionSchema = new mongoose.Schema(
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
        upazila: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Upazila",
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

unionSchema.index({ upazila: 1 });
unionSchema.index({ slug: 1 });
unionSchema.index({ deprecated_at: 1 });

const Union = mongoose.models.Union || mongoose.model("Union", unionSchema);

export default Union;
