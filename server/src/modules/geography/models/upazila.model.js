import mongoose from "mongoose";

const upazilaSchema = new mongoose.Schema(
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
        district: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "District",
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

upazilaSchema.index({ district: 1 });
upazilaSchema.index({ slug: 1 });
upazilaSchema.index({ deprecated_at: 1 });

const Upazila =
    mongoose.models.Upazila || mongoose.model("Upazila", upazilaSchema);

export default Upazila;
